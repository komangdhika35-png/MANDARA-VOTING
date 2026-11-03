import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import {
  candidateIds,
  organizationIds,
  type CandidateConfiguration,
  type CandidateConfigurations,
  type MpkMember,
} from "@/lib/election";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMpkMemberLists(value: unknown): value is Record<"chair" | "vice", unknown[]> {
  return (
    isRecord(value) &&
    Array.isArray(value.chair) &&
    Array.isArray(value.vice)
  );
}

function isValidPhotoDataUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!value) return true;

  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  const [, format, encoded] = match;
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.length > 512 * 1024 || bytes.toString("base64") !== encoded) return false;

  if (format === "jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (format === "png") {
    return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  return (
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  );
}

export async function PUT(request: Request) {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Halaman ini hanya untuk admin." }, { status: 403 });
    }

    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > 14 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran total data kandidat melebihi batas." }, { status: 413 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Data kandidat tidak valid." }, { status: 400 });
    }

    if (
      !isRecord(body) ||
      !isRecord(body.organizations) ||
      !isMpkMemberLists(body.mpkMembers) ||
      body.mpkMembers.chair.length === 0 ||
      body.mpkMembers.chair.length > 10 ||
      body.mpkMembers.vice.length === 0 ||
      body.mpkMembers.chair.length + body.mpkMembers.vice.length > 200
    ) {
      return NextResponse.json(
        { error: "Daftar calon ketua harus berisi 1–10 anggota dan calon wakil minimal 1 anggota." },
        { status: 400 },
      );
    }

    const submittedOrganizations = body.organizations;
    const configurations: CandidateConfigurations = { mpk: [], osis: [], ky: [] };
    let totalPhotoBytes = 0;

    for (const organizationId of organizationIds.filter((id) => id !== "mpk")) {
      const submittedCandidates = submittedOrganizations[organizationId];
      if (
        !Array.isArray(submittedCandidates) ||
        submittedCandidates.length !== candidateIds[organizationId].length
      ) {
        return NextResponse.json({ error: "Jumlah pasangan calon tidak valid." }, { status: 400 });
      }

      const numbers = new Set<string>();
      const candidates: CandidateConfiguration[] = [];
      for (const [index, submitted] of submittedCandidates.entries()) {
        if (!isRecord(submitted)) {
          return NextResponse.json({ error: "Data pasangan calon tidak valid." }, { status: 400 });
        }

        const id = candidateIds[organizationId][index];
        const name = typeof submitted.name === "string" ? submitted.name.trim() : "";
        const viceName = typeof submitted.viceName === "string" ? submitted.viceName.trim() : "";
        const submittedNumber =
          typeof submitted.number === "string" ? submitted.number.trim() : "";
        const photoDataUrl = submitted.photoDataUrl;
        const vision = typeof submitted.vision === "string" ? submitted.vision.trim() : "";
        const mission = typeof submitted.mission === "string" ? submitted.mission.trim() : "";
        const numericNumber = Number(submittedNumber);

        if (
          submitted.id !== id ||
          !name ||
          name.length > 80 ||
          !viceName ||
          viceName.length > 80 ||
          vision.length > 500 ||
          mission.length > 1200 ||
          !isValidPhotoDataUrl(photoDataUrl) ||
          !/^\d{1,2}$/.test(submittedNumber) ||
          numericNumber < 1 ||
          numericNumber > 99
        ) {
          return NextResponse.json(
            {
              error: `Nama, nomor, foto, visi, atau misi paslon ${organizationId.toUpperCase()} tidak valid. Foto harus JPG, PNG, atau WebP (maks. 512 KB).`,
            },
            { status: 400 },
          );
        }
        if (photoDataUrl) {
          totalPhotoBytes += Buffer.from(photoDataUrl.slice(photoDataUrl.indexOf(",") + 1), "base64").length;
          if (totalPhotoBytes > 10 * 1024 * 1024) {
            return NextResponse.json(
              { error: "Ukuran total seluruh foto calon maksimal 10 MB." },
              { status: 413 },
            );
          }
        }

        const number = String(numericNumber).padStart(2, "0");
        if (numbers.has(number)) {
          return NextResponse.json(
            { error: `Nomor paslon pada ${organizationId.toUpperCase()} tidak boleh sama.` },
            { status: 400 },
          );
        }
        numbers.add(number);
        candidates.push({ id, name, viceName, number, photoDataUrl, vision, mission });
      }
      configurations[organizationId] = candidates;
    }

    const mpkMembers: Record<"chair" | "vice", MpkMember[]> = { chair: [], vice: [] };
    const memberNamesById = new Map<string, string>();
    const memberDetailsById = new Map<
      string,
      { photoDataUrl: string; vision: string; mission: string }
    >();
    for (const position of ["chair", "vice"] as const) {
      const positionIds = new Set<string>();
      for (const submitted of body.mpkMembers[position]) {
        if (!isRecord(submitted)) {
          return NextResponse.json({ error: "Data anggota MPK tidak valid." }, { status: 400 });
        }
        const submittedId = typeof submitted.id === "string" ? submitted.id.trim() : "";
        const name = typeof submitted.name === "string" ? submitted.name.trim() : "";
        const photoDataUrl = submitted.photoDataUrl;
        const vision = typeof submitted.vision === "string" ? submitted.vision.trim() : "";
        const mission = typeof submitted.mission === "string" ? submitted.mission.trim() : "";
        if (
          !name ||
          name.length > 80 ||
          submittedId.length > 80 ||
          vision.length > 500 ||
          mission.length > 1200 ||
          !isValidPhotoDataUrl(photoDataUrl)
        ) {
          return NextResponse.json(
            { error: "Nama, foto, visi, atau misi calon MPK tidak valid. Foto harus JPG, PNG, atau WebP (maks. 512 KB)." },
            { status: 400 },
          );
        }
        if (photoDataUrl) {
          totalPhotoBytes += Buffer.from(photoDataUrl.slice(photoDataUrl.indexOf(",") + 1), "base64").length;
          if (totalPhotoBytes > 10 * 1024 * 1024) {
            return NextResponse.json(
              { error: "Ukuran total seluruh foto calon maksimal 10 MB." },
              { status: 413 },
            );
          }
        }
        const id = submittedId || `mpk-member-${randomUUID()}`;
        if (positionIds.has(id)) {
          return NextResponse.json(
            { error: `ID anggota pada daftar calon ${position === "chair" ? "ketua" : "wakil"} MPK tidak boleh sama.` },
            { status: 400 },
          );
        }
        const previousName = memberNamesById.get(id);
        if (previousName && previousName !== name) {
          return NextResponse.json(
            { error: "Nama anggota yang muncul di kedua kategori harus sama." },
            { status: 400 },
          );
        }
        const details = {
          photoDataUrl,
          vision,
          mission,
        };
        const previousDetails = memberDetailsById.get(id);
        if (
          previousDetails &&
          (previousDetails.photoDataUrl !== details.photoDataUrl ||
            previousDetails.vision !== details.vision ||
            previousDetails.mission !== details.mission)
        ) {
          return NextResponse.json(
            { error: "Foto, visi, dan misi calon yang muncul di kedua kategori harus sama." },
            { status: 400 },
          );
        }
        positionIds.add(id);
        memberNamesById.set(id, name);
        memberDetailsById.set(id, details);
        mpkMembers[position].push({ id, name, ...details });
      }
    }

    const database = getDatabase();
    let transactionOpen = false;
    try {
      database.exec("BEGIN IMMEDIATE");
      transactionOpen = true;
      const updateCandidate = database.prepare(
        `UPDATE election_candidates
         SET candidate_number = ?, candidate_name = ?, vice_name = ?
         WHERE candidate_id = ? AND organization_id = ?`,
      );

      for (const organizationId of organizationIds.filter((id) => id !== "mpk")) {
        const votes = database
          .prepare("SELECT COUNT(*) AS total FROM ballots WHERE organization_id = ?")
          .get(organizationId) as { total: number };
        const existingCandidates = database
          .prepare(
            `SELECT candidate_id, candidate_number, candidate_name, vice_name
             FROM election_candidates
             WHERE organization_id = ?`,
          )
          .all(organizationId) as {
          candidate_id: string;
          candidate_number: string;
          candidate_name: string;
          vice_name: string;
        }[];
        const existingById = new Map(
          existingCandidates.map((candidate) => [candidate.candidate_id, candidate]),
        );

        if (
          votes.total > 0 &&
          configurations[organizationId].some((candidate) => {
            const existing = existingById.get(candidate.id);
            return (
              !existing ||
              existing.candidate_number !== candidate.number ||
              existing.candidate_name !== candidate.name ||
              existing.vice_name !== candidate.viceName
            );
          })
        ) {
          database.exec("ROLLBACK");
          transactionOpen = false;
          return NextResponse.json(
            {
              error: `Pasangan calon ${organizationId.toUpperCase()} tidak dapat diubah karena suara sudah tercatat.`,
            },
            { status: 409 },
          );
        }

        for (const candidate of configurations[organizationId]) {
          const result = updateCandidate.run(
            candidate.number,
            candidate.name,
            candidate.viceName,
            candidate.id,
            organizationId,
          );
          if (result.changes !== 1) {
            throw new Error(`Kandidat ${candidate.id} tidak ditemukan di database.`);
          }
        }
      }

      const upsertCandidateDetails = database.prepare(
        `INSERT INTO election_candidate_details (candidate_id, photo_data_url, vision, mission)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(candidate_id) DO UPDATE SET
           photo_data_url = excluded.photo_data_url,
           vision = excluded.vision,
           mission = excluded.mission`,
      );
      for (const organizationId of organizationIds.filter((id) => id !== "mpk")) {
        for (const candidate of configurations[organizationId]) {
          upsertCandidateDetails.run(
            candidate.id,
            candidate.photoDataUrl,
            candidate.vision,
            candidate.mission,
          );
        }
      }

      const mpkBallotCount = database
        .prepare("SELECT COUNT(*) AS total FROM mpk_ballots")
        .get() as { total: number };
      const mpkChoiceCount = database
        .prepare("SELECT COUNT(*) AS total FROM mpk_choices")
        .get() as { total: number };
      const currentMembers = database
        .prepare(
          `SELECT mpk_members.member_id AS id, mpk_members.name, mpk_member_positions.position
           FROM mpk_members
           JOIN mpk_member_positions ON mpk_member_positions.member_id = mpk_members.member_id`,
        )
        .all() as (MpkMember & { position: "chair" | "vice" })[];
      const currentAssignments = new Set(
        currentMembers.map((member) => `${member.position}:${member.id}:${member.name}`),
      );
      const submittedAssignments = new Set(
        (["chair", "vice"] as const).flatMap((position) =>
          mpkMembers[position].map((member) => `${position}:${member.id}:${member.name}`),
        ),
      );
      const membershipChanged =
        currentAssignments.size !== submittedAssignments.size ||
        [...currentAssignments].some((assignment) => !submittedAssignments.has(assignment));

      if ((mpkBallotCount.total > 0 || mpkChoiceCount.total > 0) && membershipChanged) {
        database.exec("ROLLBACK");
        transactionOpen = false;
        return NextResponse.json(
          { error: "Daftar anggota MPK tidak dapat diubah karena suara sudah tercatat." },
          { status: 409 },
        );
      }

      if (membershipChanged) {
        database.exec("DELETE FROM mpk_member_positions");
        const deleteMember = database.prepare(
          "DELETE FROM mpk_members WHERE member_id = ?",
        );
        const currentIds = new Set(currentMembers.map((member) => member.id));
        const submittedIds = new Set(memberNamesById.keys());
        for (const id of currentIds) {
          if (!submittedIds.has(id)) deleteMember.run(id);
        }
        const insertMember = database.prepare(
          `INSERT INTO mpk_members (member_id, name) VALUES (?, ?)
           ON CONFLICT(member_id) DO UPDATE SET name = excluded.name`,
        );
        const insertPosition = database.prepare(
          "INSERT INTO mpk_member_positions (member_id, position) VALUES (?, ?)",
        );
        for (const [id, name] of memberNamesById) insertMember.run(id, name);
        for (const position of ["chair", "vice"] as const) {
          for (const member of mpkMembers[position]) insertPosition.run(member.id, position);
        }
      }

      const upsertMemberDetails = database.prepare(
        `INSERT INTO mpk_member_details (member_id, photo_data_url, vision, mission)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(member_id) DO UPDATE SET
           photo_data_url = excluded.photo_data_url,
           vision = excluded.vision,
           mission = excluded.mission`,
      );
      for (const [id, details] of memberDetailsById) {
        upsertMemberDetails.run(
          id,
          details.photoDataUrl,
          details.vision,
          details.mission,
        );
      }

      database.exec("COMMIT");
      transactionOpen = false;
    } catch (error) {
      if (transactionOpen) database.exec("ROLLBACK");
      throw error;
    }

    const savedMpkMembers = database
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
      .all() as (MpkMember & { position: "chair" | "vice" })[];
    const savedMpkMembersByPosition = {
      chair: savedMpkMembers
        .filter((member) => member.position === "chair")
        .map(({ id, name, photoDataUrl, vision, mission }) => ({
          id,
          name,
          photoDataUrl,
          vision,
          mission,
        })),
      vice: savedMpkMembers
        .filter((member) => member.position === "vice")
        .map(({ id, name, photoDataUrl, vision, mission }) => ({
          id,
          name,
          photoDataUrl,
          vision,
          mission,
        })),
    };
    return NextResponse.json({
      success: true,
      mpkMembers: savedMpkMembersByPosition,
      organizations: configurations,
    });
  } catch (error) {
    console.error("Gagal menyimpan konfigurasi kandidat:", error);
    return NextResponse.json(
      { error: "Perubahan pasangan calon belum dapat disimpan. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
