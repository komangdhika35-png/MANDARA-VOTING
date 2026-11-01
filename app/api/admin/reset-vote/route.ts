import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { organizationIds, type OrganizationId } from "@/lib/election";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Halaman ini hanya untuk admin." }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Data reset tidak valid." }, { status: 400 });
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("nis" in body) ||
      !("organizationId" in body) ||
      typeof body.nis !== "string" ||
      typeof body.organizationId !== "string" ||
      !body.nis.trim() ||
      body.nis.trim().length > 32 ||
      !organizationIds.includes(body.organizationId as OrganizationId)
    ) {
      return NextResponse.json({ error: "NIS atau organisasi tidak valid." }, { status: 400 });
    }

    const nis = body.nis.trim();
    const organizationId = body.organizationId as OrganizationId;
    const database = getDatabase();
    let transactionOpen = false;

    try {
      database.exec("BEGIN IMMEDIATE");
      transactionOpen = true;

      const choice = database
        .prepare(
          `SELECT voter_choices.candidate_id
           FROM voter_choices
           JOIN participation
             ON participation.nis = voter_choices.nis
             AND participation.organization_id = voter_choices.organization_id
           WHERE voter_choices.nis = ? AND voter_choices.organization_id = ?`,
        )
        .get(nis, organizationId) as { candidate_id: string } | undefined;

      if (!choice) {
        database.exec("ROLLBACK");
        transactionOpen = false;
        return NextResponse.json(
          { error: "Suara siswa untuk organisasi ini tidak ditemukan atau sudah direset." },
          { status: 404 },
        );
      }

      // Ballots do not identify voters, so remove one anonymous ballot for the same choice.
      const ballot = database
        .prepare(
          `DELETE FROM ballots
           WHERE ballot_id = (
             SELECT ballot_id
             FROM ballots
             WHERE organization_id = ? AND candidate_id = ?
             LIMIT 1
           )`,
        )
        .run(organizationId, choice.candidate_id);

      if (ballot.changes !== 1) {
        throw new Error("Surat suara pasangan kandidat tidak ditemukan untuk pilihan pemilih.");
      }

      database
        .prepare("DELETE FROM voter_choices WHERE nis = ? AND organization_id = ?")
        .run(nis, organizationId);
      database
        .prepare("DELETE FROM participation WHERE nis = ? AND organization_id = ?")
        .run(nis, organizationId);
      database.prepare("DELETE FROM sessions WHERE nis = ?").run(nis);

      database.exec("COMMIT");
      transactionOpen = false;

      return NextResponse.json({ success: true });
    } catch (error) {
      if (transactionOpen) database.exec("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Gagal mereset suara pemilih:", error);
    return NextResponse.json(
      { error: "Suara belum dapat direset. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
