import { getDatabase } from "@/lib/db";
import {
  candidateDatabaseIds,
  organizationIds,
  type CandidateConfiguration,
  type CandidateConfigurations,
  type ElectionCandidates,
  type MpkMember,
} from "@/lib/election";

type CandidateRow = {
  candidate_id: string;
  candidate_name: string;
  vice_name: string;
  candidate_number: string;
  photo_data_url: string;
  vision: string;
  mission: string;
};

export function getCandidateConfigurations(): CandidateConfigurations {
  const rows = getDatabase()
    .prepare(
      `SELECT
         election_candidates.candidate_id,
         election_candidates.candidate_name,
         election_candidates.vice_name,
         election_candidates.candidate_number,
         COALESCE(election_candidate_details.photo_data_url, '') AS photo_data_url,
         COALESCE(election_candidate_details.vision, '') AS vision,
         COALESCE(election_candidate_details.mission, '') AS mission
       FROM election_candidates
       LEFT JOIN election_candidate_details
         ON election_candidate_details.candidate_id = election_candidates.candidate_id`,
    )
    .all() as CandidateRow[];
  const candidatesById = new Map(rows.map((row) => [row.candidate_id, row]));
  const configurations: CandidateConfigurations = { mpk: [], osis: [], ky: [] };

  for (const organizationId of organizationIds) {
    if (organizationId === "mpk") continue;
    configurations[organizationId] = candidateDatabaseIds[organizationId].map((candidateId) => {
      const row = candidatesById.get(candidateId);
      if (!row) throw new Error(`Konfigurasi kandidat ${candidateId} tidak ditemukan.`);
      return {
        id: row.candidate_id,
        name: row.candidate_name,
        viceName: row.vice_name,
        number: row.candidate_number,
        photoDataUrl: row.photo_data_url,
        vision: row.vision,
        mission: row.mission,
      } satisfies CandidateConfiguration;
    });
  }

  return configurations;
}

export function getElectionCandidates(): ElectionCandidates {
  const database = getDatabase();
  const memberRows = database
    .prepare(
      `SELECT
         mpk_members.member_id AS id,
         mpk_members.name,
         COALESCE(mpk_member_details.photo_data_url, '') AS photoDataUrl,
         COALESCE(mpk_member_details.vision, '') AS vision,
         COALESCE(mpk_member_details.mission, '') AS mission,
         mpk_member_positions.position
       FROM mpk_members
       JOIN mpk_member_positions ON mpk_member_positions.member_id = mpk_members.member_id
       LEFT JOIN mpk_member_details ON mpk_member_details.member_id = mpk_members.member_id
       ORDER BY mpk_members.name COLLATE NOCASE`,
    )
    .all() as (MpkMember & { position: string })[];
  return {
    mpkMembers: {
      chair: memberRows
        .filter((member) => member.position === "chair")
        .map(({ id, name, photoDataUrl, vision, mission }) => ({
          id,
          name,
          photoDataUrl,
          vision,
          mission,
        })),
      vice: memberRows
        .filter((member) => member.position === "vice")
        .map(({ id, name, photoDataUrl, vision, mission }) => ({
          id,
          name,
          photoDataUrl,
          vision,
          mission,
        })),
    },
    organizations: getCandidateConfigurations(),
  };
}

export function getMpkSelections(nis: string) {
  const rows = getDatabase()
    .prepare("SELECT position, member_id FROM mpk_choices WHERE nis = ?")
    .all(nis) as { position: string; member_id: string }[];
  return {
    chair: rows.find((row) => row.position === "chair")?.member_id ?? null,
    vice: rows.find((row) => row.position === "vice")?.member_id ?? null,
  };
}
