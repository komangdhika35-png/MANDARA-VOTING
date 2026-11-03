import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getCandidateConfigurations, getElectionCandidates } from "@/lib/candidates";
import { getDatabase } from "@/lib/db";
import {
  organizationIds,
  type OrganizationId,
} from "@/lib/election";

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
        `SELECT voter_choices.organization_id, voters.nis, voters.name, voter_choices.candidate_id
         FROM voter_choices
         JOIN voters ON voters.nis = voter_choices.nis
         WHERE voters.active = 1
         ORDER BY voters.name COLLATE NOCASE`,
      )
      .all() as { organization_id: string; nis: string; name: string; candidate_id: string }[];
    const candidateConfigurations = getCandidateConfigurations();
    const electionCandidates = getElectionCandidates();
    const candidatesById = new Map(
      organizationIds.flatMap((id) =>
        candidateConfigurations[id].map((candidate) => [candidate.id, candidate] as const),
      ),
    );
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

    const mpkRows = database
      .prepare(
        `SELECT position, member_id, COUNT(*) AS votes
         FROM mpk_ballots
         GROUP BY position, member_id`,
      )
      .all() as { position: string; member_id: string; votes: number }[];
    const mpkVotes = new Map(
      mpkRows.map((row) => [`${row.position}:${row.member_id}`, row.votes]),
    );
    const mpkChoiceRows = database
      .prepare(
        `SELECT mpk_choices.nis, voters.name, mpk_choices.position, mpk_members.name AS member_name
         FROM mpk_choices
         JOIN voters ON voters.nis = mpk_choices.nis
         JOIN mpk_members ON mpk_members.member_id = mpk_choices.member_id
         WHERE voters.active = 1
         ORDER BY voters.name COLLATE NOCASE`,
      )
      .all() as {
      nis: string;
      name: string;
      position: string;
      member_name: string;
    }[];
    const mpkVoterMap = new Map<string, {
      nis: string;
      name: string;
      chair: string;
      vice: string;
    }>();
    for (const row of mpkChoiceRows) {
      const voter = mpkVoterMap.get(row.nis) ?? {
        nis: row.nis,
        name: row.name,
        chair: "",
        vice: "",
      };
      if (row.position === "chair") voter.chair = row.member_name;
      if (row.position === "vice") voter.vice = row.member_name;
      mpkVoterMap.set(row.nis, voter);
    }
    const mpkAbstainers = database
      .prepare(
        `SELECT voters.name
         FROM voters
         LEFT JOIN participation
           ON participation.nis = voters.nis
           AND participation.organization_id = 'mpk'
         WHERE voters.active = 1 AND participation.nis IS NULL
         ORDER BY voters.name COLLATE NOCASE`,
      )
      .all() as { name: string }[];
    const mpkParticipation = database
      .prepare(
        "SELECT COUNT(*) AS total FROM participation WHERE organization_id = 'mpk'",
      )
      .get() as { total: number };
    const mpkBallotTotal = database
      .prepare("SELECT COUNT(*) AS total FROM mpk_ballots")
      .get() as { total: number };

    const organizations = organizationIds.map((id) => {
      if (id === "mpk") {
        const positions = (["chair", "vice"] as const).map((position) => {
          const candidates = electionCandidates.mpkMembers[position].map((member) => ({
            id: member.id,
            name: member.name,
            votes: mpkVotes.get(`${position}:${member.id}`) ?? 0,
          }));
          const title = position === "chair" ? "Calon Ketua" : "Calon Wakil Ketua";
          return {
            id: position,
            title,
            totalVotes: candidates.reduce((total, candidate) => total + candidate.votes, 0),
            candidates,
          };
        });
        const voters = [...mpkVoterMap.values()].map((voter) => ({
          nis: voter.nis,
          name: voter.name,
          candidateName: [
            voter.chair ? `Ketua: ${voter.chair}` : "Ketua: belum memilih",
            voter.vice ? `Wakil: ${voter.vice}` : "Wakil: belum memilih",
          ].join(" · "),
        }));
        return {
          id,
          name: id.toUpperCase(),
          fullName: organizationNames[id],
          totalVotes: mpkParticipation.total,
          hasAnyVotes: mpkBallotTotal.total > 0 || mpkChoiceRows.length > 0,
          candidates: [],
          positions,
          voters,
          abstainers: mpkAbstainers.map((row) => row.name),
        };
      }

      const candidates = candidateConfigurations[id].map((candidate) => ({
        ...candidate,
        votes: votesByCandidate.get(`${id}:${candidate.id}`) ?? 0,
      }));
      const voters = voterChoiceRows
        .filter((row) => row.organization_id === id)
        .map((row) => {
          const candidate = candidatesById.get(row.candidate_id);
          if (!candidate) throw new Error(`Konfigurasi kandidat ${row.candidate_id} tidak ditemukan.`);
          return {
            nis: row.nis,
            name: row.name,
            candidateName: `${candidate.name} & ${candidate.viceName}`,
          };
        });
      const abstainers = abstainerRows.all(id) as { name: string }[];

      return {
        id,
        name: id.toUpperCase(),
        fullName: organizationNames[id],
        totalVotes: candidates.reduce((total, candidate) => total + candidate.votes, 0),
        hasAnyVotes: candidates.reduce((total, candidate) => total + candidate.votes, 0) > 0,
        candidates,
        positions: [],
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
