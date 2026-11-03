import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  candidateDatabaseIds,
  candidateIds,
  candidateNames,
  candidateViceNames,
  organizationIds,
} from "@/lib/election";

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

  const insertCandidate = database.prepare(
    `INSERT OR IGNORE INTO election_candidates
      (candidate_id, organization_id, candidate_number, candidate_name, vice_name)
     VALUES (?, ?, ?, ?, ?)`,
  );
  for (const organizationId of organizationIds) {
    candidateDatabaseIds[organizationId].forEach((candidateId, index) => {
      insertCandidate.run(
        candidateId,
        organizationId,
        String(index + 1).padStart(2, "0"),
        candidateNames[candidateId],
        candidateViceNames[candidateId],
      );
    });
  }

  const memberById = new Map<string, string>();
  const insertMember = database.prepare(
    "INSERT OR IGNORE INTO mpk_members (member_id, name) VALUES (?, ?)",
  );
  const legacyCandidates = database
    .prepare(
      `SELECT candidate_id, candidate_name, vice_name
       FROM election_candidates
       WHERE organization_id = 'mpk'`,
    )
    .all() as { candidate_id: string; candidate_name: string; vice_name: string }[];
  for (const candidate of legacyCandidates) {
    const index = candidateIds.mpk.indexOf(candidate.candidate_id);
    if (index < 0) continue;
    const chairId = `mpk-member-${index * 2 + 1}`;
    const viceId = `mpk-member-${index * 2 + 2}`;
    memberById.set(candidate.candidate_id, chairId);
    insertMember.run(chairId, candidate.candidate_name);
    insertMember.run(viceId, candidate.vice_name);
  }

  const memberCategoryMigration = "mpk-member-categories-v1";
  const categoryMigration = database
    .prepare("SELECT 1 FROM app_migrations WHERE migration_id = ?")
    .get(memberCategoryMigration);
  if (!categoryMigration) {
    database.exec("BEGIN IMMEDIATE");
    try {
      const addPosition = database.prepare(
        "INSERT OR IGNORE INTO mpk_member_positions (member_id, position) VALUES (?, ?)",
      );
      const mpkMembers = database
        .prepare("SELECT member_id FROM mpk_members ORDER BY member_id")
        .all() as { member_id: string }[];

      for (const member of mpkMembers) {
        const numericId = Number(member.member_id.replace("mpk-member-", ""));
        if (!Number.isInteger(numericId) || numericId < 1) continue;
        addPosition.run(member.member_id, numericId % 2 === 1 ? "chair" : "vice");
      }

      database
        .prepare("INSERT INTO app_migrations (migration_id, applied_at) VALUES (?, ?)")
        .run(memberCategoryMigration, Math.floor(Date.now() / 1000));
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }

  const migrationId = "mpk-independent-ballots-v1";
  const migration = database
    .prepare("SELECT 1 FROM app_migrations WHERE migration_id = ?")
    .get(migrationId);
  if (!migration) {
    database.exec("BEGIN IMMEDIATE");
    try {
      const legacyBallots = database
        .prepare(
          "SELECT ballot_id, candidate_id, cast_at FROM ballots WHERE organization_id = 'mpk'",
        )
        .all() as { ballot_id: string; candidate_id: string; cast_at: number }[];
      const legacyChoices = database
        .prepare(
          `SELECT nis, candidate_id, voted_at
           FROM voter_choices
           WHERE organization_id = 'mpk'`,
        )
        .all() as { nis: string; candidate_id: string; voted_at: number }[];
      const insertBallot = database.prepare(
        "INSERT INTO mpk_ballots (ballot_id, position, member_id, cast_at) VALUES (?, ?, ?, ?)",
      );
      const insertChoice = database.prepare(
        "INSERT INTO mpk_choices (nis, position, member_id, voted_at) VALUES (?, ?, ?, ?)",
      );

      for (const ballot of legacyBallots) {
        const chairId = memberById.get(ballot.candidate_id);
        const ticketIndex = candidateIds.mpk.indexOf(ballot.candidate_id);
        const viceId = ticketIndex >= 0 ? `mpk-member-${ticketIndex * 2 + 2}` : undefined;
        if (!chairId || !viceId) {
          throw new Error(`Tidak dapat memigrasikan suara MPK ${ballot.ballot_id}.`);
        }
        insertBallot.run(`${ballot.ballot_id}:chair`, "chair", chairId, ballot.cast_at);
        insertBallot.run(`${ballot.ballot_id}:vice`, "vice", viceId, ballot.cast_at);
      }

      for (const choice of legacyChoices) {
        const chairId = memberById.get(choice.candidate_id);
        const ticketIndex = candidateIds.mpk.indexOf(choice.candidate_id);
        const viceId = ticketIndex >= 0 ? `mpk-member-${ticketIndex * 2 + 2}` : undefined;
        if (!chairId || !viceId) {
          throw new Error(`Tidak dapat memigrasikan pilihan MPK untuk NIS ${choice.nis}.`);
        }
        insertChoice.run(choice.nis, "chair", chairId, choice.voted_at);
        insertChoice.run(choice.nis, "vice", viceId, choice.voted_at);
      }

      database.exec("DELETE FROM ballots WHERE organization_id = 'mpk'");
      database.exec("DELETE FROM voter_choices WHERE organization_id = 'mpk'");
      database
        .prepare("INSERT INTO app_migrations (migration_id, applied_at) VALUES (?, ?)")
        .run(migrationId, Math.floor(Date.now() / 1000));
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }

  return database;
}

export function getDatabase() {
  const database = globalForDatabase.suaraMandaraDatabase ??= createDatabase();
  database.exec(`
    CREATE TABLE IF NOT EXISTS election_candidate_details (
      candidate_id TEXT PRIMARY KEY NOT NULL
        REFERENCES election_candidates(candidate_id) ON DELETE CASCADE,
      photo_data_url TEXT NOT NULL DEFAULT '',
      vision TEXT NOT NULL DEFAULT '',
      mission TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS mpk_member_details (
      member_id TEXT PRIMARY KEY NOT NULL
        REFERENCES mpk_members(member_id) ON DELETE CASCADE,
      photo_data_url TEXT NOT NULL DEFAULT '',
      vision TEXT NOT NULL DEFAULT '',
      mission TEXT NOT NULL DEFAULT ''
    );
  `);
  return database;
}
