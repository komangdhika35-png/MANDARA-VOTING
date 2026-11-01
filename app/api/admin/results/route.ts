import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { candidateIds, candidateNames, organizationIds, type OrganizationId } from "@/lib/election";

export const runtime = "nodejs";

const organizationNames: Record<OrganizationId, string> = {
  mpk: "Majelis Perwakilan Kelas",
  osis: "Organisasi Siswa Intra Sekolah",
  ky: "Komisi Yudisial",
};

export async function GET() {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Halaman ini hanya untuk admin." }, { status: 403 });
    }

    const rows = getDatabase()
      .prepare(
        `SELECT organization_id, candidate_id, COUNT(*) AS votes
         FROM ballots
         GROUP BY organization_id, candidate_id`,
      )
      .all() as { organization_id: string; candidate_id: string; votes: number }[];
    const database = getDatabase();
    const votesByCandidate = new Map(
      rows.map((row) => [`${row.organization_id}:${row.candidate_id}`, row.votes]),
    );
    const voterChoiceRows = database
      .prepare(
        `SELECT voter_choices.organization_id, voters.name, voter_choices.candidate_id
         FROM voter_choices
         JOIN voters ON voters.nis = voter_choices.nis
         WHERE voters.active = 1
         ORDER BY voters.name COLLATE NOCASE`,
      )
      .all() as { organization_id: string; name: string; candidate_id: string }[];
    const abstainerRows = database
      .prepare(
        `SELECT voters.name, participation.organization_id
         FROM voters
         LEFT JOIN participation
           ON participation.nis = voters.nis
           AND participation.organization_id = ?
         WHERE voters.active = 1 AND participation.nis IS NULL
         ORDER BY voters.name COLLATE NOCASE`,
      );

    const organizations = organizationIds.map((id) => {
      const candidates = candidateIds[id].map((candidateId) => ({
        id: candidateId,
        name: candidateNames[candidateId],
        votes: votesByCandidate.get(`${id}:${candidateId}`) ?? 0,
      }));
      const voters = voterChoiceRows
        .filter((row) => row.organization_id === id)
        .map((row) => ({
          name: row.name,
          candidateName: candidateNames[row.candidate_id as keyof typeof candidateNames],
        }));
      const abstainers = abstainerRows.all(id) as { name: string }[];

      return {
        id,
        name: id.toUpperCase(),
        fullName: organizationNames[id],
        totalVotes: candidates.reduce((total, candidate) => total + candidate.votes, 0),
        candidates,
        voters,
        abstainers: abstainers.map((row) => row.name),
      };
    });

    return NextResponse.json({
      organizations,
      totalVotes: organizations.reduce((total, organization) => total + organization.totalVotes, 0),
    });
  } catch (error) {
    console.error("Gagal memuat rekap suara:", error);
    return NextResponse.json(
      { error: "Rekap suara belum dapat dimuat. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
