import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminSession, createSession } from "@/lib/auth";
import { getMpkSelections } from "@/lib/candidates";
import { getDatabase } from "@/lib/db";
import { organizationIds } from "@/lib/election";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data login tidak valid." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Data login tidak valid." }, { status: 400 });
  }

  try {
    if (
      "username" in body &&
      typeof body.username === "string" &&
      body.username.trim().toLocaleLowerCase("en-US") === "admin"
    ) {
      if (!("password" in body) || typeof body.password !== "string") {
        return NextResponse.json({ error: "Password admin wajib diisi." }, { status: 400 });
      }

      const expectedPassword = process.env.ADMIN_PASSWORD;
      if (!expectedPassword) {
        console.error("ADMIN_PASSWORD belum dikonfigurasi.");
        return NextResponse.json(
          { error: "Login admin belum dikonfigurasi. Hubungi pengelola aplikasi." },
          { status: 503 },
        );
      }

      const submittedHash = createHash("sha256").update(body.password).digest();
      const expectedHash = createHash("sha256").update(expectedPassword).digest();
      if (!timingSafeEqual(submittedHash, expectedHash)) {
        return NextResponse.json({ error: "Password admin salah." }, { status: 401 });
      }

      await createAdminSession();
      return NextResponse.json({ role: "admin" });
    }

    if (!("nis" in body) || typeof body.nis !== "string") {
      return NextResponse.json({ error: "NIS wajib diisi." }, { status: 400 });
    }

    const nis = body.nis.trim();
    if (!nis || nis.length > 32 || nis.toLocaleLowerCase("en-US") === "admin") {
      return NextResponse.json({ error: "NIS tidak valid." }, { status: 400 });
    }

    const voter = getDatabase()
      .prepare(
        `SELECT voters.nis, voters.name
         FROM voter_ids
         JOIN voters ON voters.nis = voter_ids.nis
         WHERE voter_ids.identifier = ? AND voters.active = 1`,
      )
      .get(nis) as { nis: string; name: string } | undefined;

    if (!voter) {
      return NextResponse.json(
        { error: "NIS tidak terdaftar sebagai pemilih." },
        { status: 401 },
      );
    }

    await createSession(voter.nis);
    const rows = getDatabase()
      .prepare("SELECT organization_id FROM participation WHERE nis = ?")
      .all(voter.nis) as { organization_id: string }[];

    return NextResponse.json({
      voter: { name: voter.name },
      mpkSelections: getMpkSelections(voter.nis),
      votedOrganizations: rows
        .map((row) => row.organization_id)
        .filter((id) => organizationIds.includes(id as (typeof organizationIds)[number])),
    });
  } catch (error) {
    console.error("Gagal memproses login pemilih:", error);
    return NextResponse.json(
      { error: "Login belum dapat diproses. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
