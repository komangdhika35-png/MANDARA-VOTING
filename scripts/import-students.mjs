import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { parse } from "csv-parse/sync";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = process.argv[2];

if (!csvPath) {
  console.error("Cara pakai: npm run import:siswa -- <file.csv>");
  process.exitCode = 1;
} else {
  try {
    const inputPath = resolve(process.cwd(), csvPath);
    const rows = parse(readFileSync(inputPath, "utf8"), {
      bom: true,
      columns: (headers) => headers.map((header) => header.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
    });

    if (rows.length === 0 || !("nis" in rows[0]) || !("nama" in rows[0])) {
      throw new Error("CSV harus memiliki kolom nis dan nama, serta minimal satu data siswa.");
    }

    const seenNis = new Set();
    const students = rows.map((row, index) => {
      const nis = String(row.nis ?? "").trim();
      const name = String(row.nama ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
      if (!nis || !name) {
        throw new Error(`Data pada baris ${index + 2} belum memiliki NIS atau nama.`);
      }
      if (nis.length > 32 || name.length > 120) {
        throw new Error(`Data pada baris ${index + 2} melebihi panjang yang diizinkan.`);
      }
      if (seenNis.has(nis)) {
        throw new Error(`NIS duplikat ditemukan pada baris ${index + 2}.`);
      }
      seenNis.add(nis);
      return { nis, name };
    });

    const databasePath = join(root, ".data", "suara-mandara.sqlite");
    mkdirSync(dirname(databasePath), { recursive: true });
    const database = new DatabaseSync(databasePath, {
      enableForeignKeyConstraints: true,
      timeout: 5000,
    });
    database.exec(readFileSync(join(root, "lib", "schema.sql"), "utf8"));

    const insertStudent = database.prepare(
      `INSERT INTO voters (nis, name, active) VALUES (?, ?, 1)
       ON CONFLICT(nis) DO UPDATE SET name = excluded.name, active = 1`,
    );
    database.exec("BEGIN IMMEDIATE");
    try {
      for (const student of students) {
        insertStudent.run(student.nis, student.name);
      }
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    } finally {
      database.close();
    }

    console.log(`${students.length} data siswa berhasil dimasukkan ke SQLite.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Gagal mengimpor data siswa.");
    process.exitCode = 1;
  }
}
