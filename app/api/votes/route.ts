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
    !("candidateId" in body) ||
    typeof body.organizationId !== "string" ||
    typeof body.candidateId !== "string" ||
    !organizationIds.includes(body.organizationId as OrganizationId)
  ) {
    return NextResponse.json({ error: "Organisasi atau kandidat tidak valid." }, { status: 400 });
  }

  const organizationId = body.organizationId as OrganizationId;
  if (!candidateIds[organizationId].some((id) => id === body.candidateId)) {
    return NextResponse.json({ error: "Kandidat tidak valid." }, { status: 400 });
  }

  const database = getDatabase();
  let transactionOpen = false;
  try {
    database.exec("BEGIN IMMEDIATE");
    transactionOpen = true;

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
