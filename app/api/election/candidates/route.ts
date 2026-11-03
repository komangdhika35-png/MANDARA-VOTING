import { NextResponse } from "next/server";
import { getElectionCandidates } from "@/lib/candidates";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(getElectionCandidates());
  } catch (error) {
    console.error("Gagal memuat konfigurasi kandidat:", error);
    return NextResponse.json(
      { error: "Data kandidat belum dapat dimuat. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
