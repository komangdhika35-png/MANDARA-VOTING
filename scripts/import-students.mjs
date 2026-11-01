import { readFileSync, mkdirSync } from "node:fs";
import { dirname, extname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { parse } from "csv-parse/sync";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const inputFile = args.find((argument) => argument !== "--dry-run");

function getCellText(cell) {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") {
    if (typeof value === "number" && /^0+$/.test(cell.numFmt ?? "")) {
      return String(value).padStart(cell.numFmt.length, "0");
    }
    return String(value);
  }
  if (Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text ?? "").join("");
  }
  if (typeof value.text === "string") return value.text;
  if ("result" in value && value.result !== null && value.result !== undefined) {
    return String(value.result);
  }
  return "";
}

function validateStudents(students) {
  const seenAliases = new Map();
  for (const student of students) {
    if (!student.nis || !student.name || student.name.length > 120) {
      throw new Error("Ada data siswa tanpa NIS/nama atau nama terlalu panjang.");
    }

    for (const identifier of student.identifiers) {
      if (identifier.length > 32) {
        throw new Error("Ada NIS yang melebihi panjang yang diizinkan.");
      }
      const previousNis = seenAliases.get(identifier);
      if (previousNis && previousNis !== student.nis) {
        throw new Error("NIS duplikat ditemukan pada daftar siswa.");
      }
      seenAliases.set(identifier, student.nis);
    }
  }
}

async function readCsv(inputPath) {
  const rows = parse(readFileSync(inputPath, "utf8"), {
    bom: true,
    columns: (headers) => headers.map((header) => header.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
  });

  if (rows.length === 0 || !("nis" in rows[0]) || !("nama" in rows[0])) {
    throw new Error("CSV harus memiliki kolom nis dan nama, serta minimal satu data siswa.");
  }

  return {
    students: rows.map((row) => {
      const nis = String(row.nis ?? "").trim();
      const name = String(row.nama ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
      if (!nis || !name) throw new Error("Ada data CSV yang belum memiliki NIS atau nama.");
      return { nis, name, identifiers: [nis] };
    }),
    skippedSheets: [],
  };
}

async function readWorkbook(inputPath) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(inputPath);
  const students = [];
  const skippedSheets = [];
  const combinedIdPattern = /^(\d{10})[.\s/\\-]+(\d{4})$/;

  for (const worksheet of workbook.worksheets) {
    let headerRow = 0;
    let idColumn = 0;
    let nameColumn = 0;

    for (let rowNumber = 1; rowNumber <= Math.min(worksheet.rowCount, 40); rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      for (let column = 1; column <= Math.min(row.cellCount, 12); column += 1) {
        const header = getCellText(row.getCell(column))
          .normalize("NFC")
          .trim()
          .replace(/\s+/g, " ")
          .toUpperCase();
        if (header === "NISN/NIS") idColumn = column;
        if (header === "NAMA SISWA") nameColumn = column;
      }
      if (idColumn && nameColumn) {
        headerRow = rowNumber;
        break;
      }
      idColumn = 0;
      nameColumn = 0;
    }

    if (!headerRow) {
      skippedSheets.push(worksheet.name);
      continue;
    }

    let validCount = 0;
    for (let rowNumber = headerRow + 1; rowNumber <= worksheet.actualRowCount; rowNumber += 1) {
      const idText = getCellText(worksheet.getRow(rowNumber).getCell(idColumn)).trim();
      const name = getCellText(worksheet.getRow(rowNumber).getCell(nameColumn))
        .normalize("NFC")
        .trim()
        .replace(/\s+/g, " ");
      const match = combinedIdPattern.exec(idText);
      if (!match || !name) continue;

      const nisn = match[1];
      const nis = match[2];
      students.push({
        nis: nisn,
        name,
        identifiers: [...new Set([nisn, nis, `${nisn}${nis}`])],
      });
      validCount += 1;
    }

    if (validCount === 0) skippedSheets.push(worksheet.name);
  }

  if (students.length === 0) {
    throw new Error("Tidak ada pasangan NIS dan nama siswa yang cocok di workbook.");
  }

  return { students, skippedSheets: [...new Set(skippedSheets)] };
}

async function main() {
  if (!inputFile) {
    throw new Error(
      "Cara pakai: npm run import:siswa -- [--dry-run] <file.csv|file.xlsx>",
    );
  }

  const inputPath = resolve(process.cwd(), inputFile);
  const extension = extname(inputPath).toLowerCase();
  const data =
    extension === ".xlsx"
      ? await readWorkbook(inputPath)
      : extension === ".csv"
        ? await readCsv(inputPath)
        : null;
  if (!data) throw new Error("Format file harus CSV atau XLSX.");

  validateStudents(data.students);
  console.log(`Pasangan NIS dan nama yang cocok: ${data.students.length}.`);
  if (data.skippedSheets.length > 0) {
    console.log(
      `Lembar tanpa pasangan NIS/nama yang dapat digunakan: ${data.skippedSheets.length}.`,
    );
  }

  if (dryRun) {
    console.log("Simulasi selesai; database tidak diubah.");
    return;
  }

  const databasePath = join(root, ".data", "suara-mandara.sqlite");
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath, {
    enableForeignKeyConstraints: true,
    timeout: 5000,
  });
  database.exec(readFileSync(join(root, "lib", "schema.sql"), "utf8"));

  const findIdentifier = database.prepare(
    "SELECT nis FROM voter_ids WHERE identifier = ?",
  );
  const insertStudent = database.prepare(
    `INSERT INTO voters (nis, name, active) VALUES (?, ?, 1)
     ON CONFLICT(nis) DO UPDATE SET name = excluded.name, active = 1`,
  );
  const insertIdentifier = database.prepare(
    "INSERT OR IGNORE INTO voter_ids (identifier, nis) VALUES (?, ?)",
  );

  database.exec("BEGIN IMMEDIATE");
  try {
    for (const student of data.students) {
      for (const identifier of student.identifiers) {
        const existing = findIdentifier.get(identifier);
        if (existing && existing.nis !== student.nis) {
          throw new Error("NIS pada file sudah terhubung ke siswa lain di database.");
        }
      }
      insertStudent.run(student.nis, student.name);
      for (const identifier of student.identifiers) {
        insertIdentifier.run(identifier, student.nis);
      }
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  } finally {
    database.close();
  }

  console.log(`${data.students.length} data siswa berhasil dimasukkan ke SQLite.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Gagal mengimpor data siswa.");
  process.exitCode = 1;
});
