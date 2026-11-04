import { NextResponse } from "next/server";
import { deleteSession, getAdminSession, getSessionVoter } from "@/lib/auth";
import { getCandidateSelections, getMpkSelections } from "@/lib/candidates";
import { getDatabase } from "@/lib/db";
import { organizationIds } from "@/lib/election";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (await getAdminSession()) {
      return NextResponse.json({ role: "admin" });
    }

    const voter = await getSessionVoter();
    if (!voter) {
      return NextResponse.json({ error: "Sesi login tidak ditemukan." }, { status: 401 });
    }

    const rows = getDatabase()
      .prepare("SELECT organization_id FROM participation WHERE nis = ?")
      .all(voter.nis) as { organization_id: string }[];

    return NextResponse.json({
      role: "student",
      voter: { name: voter.name },
      mpkSelections: getMpkSelections(voter.nis),
      candidateSelections: getCandidateSelections(voter.nis),
      votedOrganizations: rows
        .map((row) => row.organization_id)
        .filter((id) => organizationIds.includes(id as (typeof organizationIds)[number])),
    });
  } catch (error) {
    console.error("Gagal memuat sesi pemilih:", error);
    return NextResponse.json(
      { error: "Data pemilihan belum dapat dimuat. Silakan coba lagi." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gagal mengakhiri sesi pemilih:", error);
    return NextResponse.json(
      { error: "Sesi belum dapat diakhiri. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
