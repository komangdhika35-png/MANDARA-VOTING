import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const globalForDatabase = globalThis as typeof globalThis & {
  suaraMandaraDatabase?: DatabaseSync;
};

function createDatabase() {
  const databasePath = join(process.cwd(), ".data", "suara-mandara.sqlite");
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath, {
    enableForeignKeyConstraints: true,
    timeout: 5000,
  });
  database.exec(readFileSync(join(process.cwd(), "lib", "schema.sql"), "utf8"));
  return database;
}

export function getDatabase() {
  globalForDatabase.suaraMandaraDatabase ??= createDatabase();
  return globalForDatabase.suaraMandaraDatabase;
}
