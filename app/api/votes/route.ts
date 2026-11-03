import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionVoter } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { candidateIds, organizationIds, type OrganizationId } from "@/lib/election";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const voter = await getSessionVoter();
  if (!voter) {
    return NextResponse.json({ error: "Silakan masuk kembali untuk memilih." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data pilihan tidak valid." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("organizationId" in body) ||
    typeof body.organizationId !== "string" ||
    !organizationIds.includes(body.organizationId as OrganizationId)
  ) {
    return NextResponse.json({ error: "Organisasi atau kandidat tidak valid." }, { status: 400 });
  }

  const organizationId = body.organizationId as OrganizationId;
  const database = getDatabase();
  let transactionOpen = false;
  try {
    database.exec("BEGIN IMMEDIATE");
    transactionOpen = true;

    if (organizationId === "mpk") {
      if (
        !("position" in body) ||
        (body.position !== "chair" && body.position !== "vice") ||
        !("memberId" in body) ||
        typeof body.memberId !== "string"
      ) {
        database.exec("ROLLBACK");
        transactionOpen = false;
        return NextResponse.json({ error: "Pilihan jabatan MPK tidak valid." }, { status: 400 });
      }

      const member = database
        .prepare(
          "SELECT 1 FROM mpk_member_positions WHERE member_id = ? AND position = ?",
        )
        .get(body.memberId, body.position);
      if (!member) {
        database.exec("ROLLBACK");
        transactionOpen = false;
        return NextResponse.json({ error: "Anggota MPK tidak ditemukan." }, { status: 400 });
      }

      const existingChoice = database
        .prepare("SELECT 1 FROM mpk_choices WHERE nis = ? AND position = ?")
        .get(voter.nis, body.position);
      if (existingChoice) {
        database.exec("ROLLBACK");
        transactionOpen = false;
        return NextResponse.json(
          { error: "Pilihan untuk jabatan MPK ini sudah tercatat." },
          { status: 409 },
        );
      }

      const now = Math.floor(Date.now() / 1000);
      database
        .prepare(
          "INSERT INTO mpk_choices (nis, position, member_id, voted_at) VALUES (?, ?, ?, ?)",
        )
        .run(voter.nis, body.position, body.memberId, now);
      database
        .prepare(
          "INSERT INTO mpk_ballots (ballot_id, position, member_id, cast_at) VALUES (?, ?, ?, ?)",
        )
        .run(randomUUID(), body.position, body.memberId, now);

      const completedChoices = database
        .prepare("SELECT COUNT(*) AS total FROM mpk_choices WHERE nis = ?")
        .get(voter.nis) as { total: number };
      if (completedChoices.total === 2) {
        database
          .prepare(
            `INSERT OR IGNORE INTO participation (nis, organization_id, voted_at)
             VALUES (?, 'mpk', ?)`,
          )
          .run(voter.nis, now);
      }

      database.exec("COMMIT");
      transactionOpen = false;
      const votedRows = database
        .prepare("SELECT organization_id FROM participation WHERE nis = ?")
        .all(voter.nis) as { organization_id: string }[];
      const selections = database
        .prepare("SELECT position, member_id FROM mpk_choices WHERE nis = ?")
        .all(voter.nis) as { position: string; member_id: string }[];

      return NextResponse.json({
        votedOrganizations: votedRows.map((row) => row.organization_id),
        mpkSelections: {
          chair: selections.find((row) => row.position === "chair")?.member_id ?? null,
          vice: selections.find((row) => row.position === "vice")?.member_id ?? null,
        },
      });
    }

    if (!("candidateId" in body) || typeof body.candidateId !== "string") {
      database.exec("ROLLBACK");
      transactionOpen = false;
      return NextResponse.json({ error: "Kandidat tidak valid." }, { status: 400 });
    }
    if (!candidateIds[organizationId].some((id) => id === body.candidateId)) {
      database.exec("ROLLBACK");
      transactionOpen = false;
      return NextResponse.json({ error: "Kandidat tidak valid." }, { status: 400 });
    }

    const existingVote = database
      .prepare("SELECT 1 FROM participation WHERE nis = ? AND organization_id = ?")
      .get(voter.nis, organizationId);

    if (existingVote) {
      database.exec("ROLLBACK");
      transactionOpen = false;
      return NextResponse.json(
        { error: "Suaramu untuk organisasi ini sudah tercatat." },
        { status: 409 },
      );
    }

    const now = Math.floor(Date.now() / 1000);
    database
      .prepare("INSERT INTO participation (nis, organization_id, voted_at) VALUES (?, ?, ?)")
      .run(voter.nis, organizationId, now);
    database
      .prepare(
        "INSERT INTO voter_choices (nis, organization_id, candidate_id, voted_at) VALUES (?, ?, ?, ?)",
      )
      .run(voter.nis, organizationId, body.candidateId, now);
    database
      .prepare(
        "INSERT INTO ballots (ballot_id, organization_id, candidate_id, cast_at) VALUES (?, ?, ?, ?)",
      )
      .run(randomUUID(), organizationId, body.candidateId, now);

    database.exec("COMMIT");
    transactionOpen = false;

    const rows = database
      .prepare("SELECT organization_id FROM participation WHERE nis = ?")
      .all(voter.nis) as { organization_id: string }[];

    return NextResponse.json({
      votedOrganizations: rows.map((row) => row.organization_id),
    });
  } catch (error) {
    if (transactionOpen) database.exec("ROLLBACK");
    console.error("Gagal menyimpan suara ke SQLite:", error);
    return NextResponse.json(
      { error: "Suara belum dapat disimpan. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
