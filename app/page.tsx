"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CandidateConfigurations,
  ElectionCandidates,
  OrganizationId,
} from "@/lib/election";
import AdminDashboard from "@/app/admin-dashboard";

type Candidate = {
  id: string;
  name: string;
  viceName: string;
  className: string;
  number: string;
  photoDataUrl?: string;
  vision?: string;
  mission?: string;
  initials: string;
  color: string;
  program: string;
  motto: string;
};

const organizations: {
  id: OrganizationId;
  name: string;
  fullName: string;
  description: string;
  color: string;
  initials: string;
  candidates: Candidate[];
}[] = [
  {
    id: "mpk",
    name: "MPK",
    fullName: "Majelis Perwakilan Kelas",
    description: "Pilih anggota MPK untuk menjadi ketua dan wakil secara terpisah.",
    color: "lilac",
    initials: "M",
    candidates: [],
  },
  {
    id: "osis",
    name: "OSIS",
    fullName: "Organisasi Siswa Intra Sekolah",
    description: "Wujudkan ide dan kegiatan seru bersama.",
    color: "mint",
    initials: "O",
    candidates: [
      {
        id: "osis-1",
        name: "Dimas Saputra",
        viceName: "Citra Lestari",
        className: "XI IPA 1",
        number: "01",
        initials: "DS",
        color: "mint",
        program: "Pekan kreativitas siswa dan kegiatan lintas minat setiap bulan.",
        motto: "Aktif bersama, maju bersama.",
      },
      {
        id: "osis-2",
        name: "Alya Maharani",
        viceName: "Rafi Pratama",
        className: "XI IPS 2",
        number: "02",
        initials: "AM",
        color: "peach",
        program: "OSIS yang dekat, kreatif, dan terbuka untuk semua ide.",
        motto: "Ide kecil, perubahan besar.",
      },
      {
        id: "osis-3",
        name: "Fajar Ramadhan",
        viceName: "Dewi Anggraini",
        className: "X IPA 2",
        number: "03",
        initials: "FR",
        color: "blue",
        program: "Kolaborasi komunitas sekolah dan aksi peduli lingkungan.",
        motto: "Bergerak untuk sesama.",
      },
    ],
  },
  {
    id: "ky",
    name: "KY",
    fullName: "Komisi Yudisial",
    description: "Jaga nilai, keadilan, dan integritas bersama.",
    color: "peach",
    initials: "K",
    candidates: [
      {
        id: "ky-1",
        name: "Keisha Anindya",
        viceName: "Arkan Dwi Putra",
        className: "XI IPA 3",
        number: "01",
        initials: "KA",
        color: "peach",
        program: "Edukasi tata tertib yang ramah, adil, dan mudah dipahami.",
        motto: "Adil dalam sikap, jujur dalam aksi.",
      },
      {
        id: "ky-2",
        name: "Bagas Wicaksono",
        viceName: "Aulia Rahma",
        className: "XI IPS 1",
        number: "02",
        initials: "BW",
        color: "lilac",
        program: "Ruang mediasi yang aman untuk setiap permasalahan siswa.",
        motto: "Tegas tanpa menghakimi.",
      },
      {
        id: "ky-3",
        name: "Intan Permata",
        viceName: "Yoga Prasetyo",
        className: "X IPA 1",
        number: "03",
        initials: "IP",
        color: "yellow",
        program: "Membangun budaya disiplin dengan empati dan keteladanan.",
        motto: "Jujur itu pilihan berani.",
      },
    ],
  },
];

type VoteRecord = Partial<Record<OrganizationId, true>>;
type MpkPosition = "chair" | "vice";
type MpkSelections = Record<MpkPosition, string | null>;

const mpkPosterPrograms = [
  {
    vision: "MPK yang terbuka, aspiratif, dan dekat dengan seluruh siswa.",
    missions: ["Membuka ruang aspirasi rutin", "Menyampaikan masukan siswa secara transparan"],
    accent: "#b76b78",
  },
  {
    vision: "Mewujudkan perwakilan kelas yang aktif dan bertanggung jawab.",
    missions: ["Mengadakan forum perwakilan kelas", "Mengawal tindak lanjut aspirasi"],
    accent: "#5c8193",
  },
  {
    vision: "Membangun lingkungan sekolah yang inklusif dan kolaboratif.",
    missions: ["Merangkul ide dari setiap kelas", "Mendorong kegiatan kolaborasi siswa"],
    accent: "#9b8650",
  },
  {
    vision: "Menjadikan MPK sebagai jembatan komunikasi yang terpercaya.",
    missions: ["Menyediakan kanal masukan siswa", "Menyampaikan perkembangan secara berkala"],
    accent: "#63846b",
  },
  {
    vision: "Mendorong budaya sekolah yang partisipatif dan saling menghargai.",
    missions: ["Mengajak siswa terlibat dalam evaluasi", "Menjaga komunikasi yang santun"],
    accent: "#b47b50",
  },
  {
    vision: "Mewakili suara siswa dengan jujur, adil, dan konsisten.",
    missions: ["Mengumpulkan pendapat secara merata", "Membahas aspirasi dengan bertanggung jawab"],
    accent: "#796a99",
  },
  {
    vision: "Menciptakan perwakilan siswa yang responsif dan terbuka.",
    missions: ["Menampung masukan melalui pertemuan kelas", "Memberi kabar atas aspirasi yang diterima"],
    accent: "#a65d64",
  },
  {
    vision: "Menguatkan kerja sama antara siswa, kelas, dan organisasi.",
    missions: ["Membangun koordinasi antarkelas", "Mendukung program sekolah yang positif"],
    accent: "#528176",
  },
  {
    vision: "Membawa aspirasi siswa menjadi masukan yang bermanfaat.",
    missions: ["Mendengar tanpa membeda-bedakan", "Menyusun usulan berdasarkan kebutuhan siswa"],
    accent: "#8e775c",
  },
  {
    vision: "Mewujudkan MPK yang aktif, tertib, dan dapat dipercaya.",
    missions: ["Menjalankan tugas perwakilan secara konsisten", "Mendorong evaluasi kegiatan yang terbuka"],
    accent: "#687b9a",
  },
] as const;

function toVoteRecord(organizationIds: OrganizationId[]): VoteRecord {
  const record: VoteRecord = {};
  for (const organizationId of organizationIds) record[organizationId] = true;
  return record;
}

export default function Home() {
  const [nis, setNis] = useState("");
  const [password, setPassword] = useState("");
  const [adminPasswordStep, setAdminPasswordStep] = useState(false);
  const adminPasswordRef = useRef<HTMLInputElement>(null);
  const [voter, setVoter] = useState("");
  const [role, setRole] = useState<"student" | "admin" | null>(null);
  const [activeOrganization, setActiveOrganization] =
    useState<OrganizationId>("mpk");
  const [votes, setVotes] = useState<VoteRecord>({});
  const [mpkSelections, setMpkSelections] = useState<MpkSelections>({
    chair: null,
    vice: null,
  });
  const [electionCandidates, setElectionCandidates] = useState<ElectionCandidates | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [selectedMpkPosition, setSelectedMpkPosition] = useState<MpkPosition>("chair");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [appError, setAppError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (adminPasswordStep) adminPasswordRef.current?.focus();
  }, [adminPasswordStep]);

  useEffect(() => {
    let active = true;
    async function loadSession() {
      try {
        const [response, candidateResponse] = await Promise.all([
          fetch("/api/auth/session", { cache: "no-store" }),
          fetch("/api/election/candidates", { cache: "no-store" }),
        ]);
        if (!active) return;

        const candidateData = (await candidateResponse.json()) as {
          mpkMembers?: ElectionCandidates["mpkMembers"];
          organizations?: CandidateConfigurations;
          error?: string;
        };
        if (!candidateResponse.ok || !candidateData.organizations || !candidateData.mpkMembers) {
          throw new Error(candidateData.error ?? "Gagal memuat pasangan calon.");
        }
        setElectionCandidates({
          organizations: candidateData.organizations,
          mpkMembers: candidateData.mpkMembers,
        });
        if (response.status === 401) return;

        const data = (await response.json()) as {
          role?: "student" | "admin";
          voter?: { name: string };
          votedOrganizations?: OrganizationId[];
          mpkSelections?: MpkSelections;
          error?: string;
        };
        if (!response.ok) throw new Error(data.error ?? "Gagal memuat sesi pemilih.");
        if (!active) return;

        setRole(data.role ?? "student");
        setVoter(data.voter?.name ?? "");
        setVotes(toVoteRecord(data.votedOrganizations ?? []));
        setMpkSelections(data.mpkSelections ?? { chair: null, vice: null });
      } catch (error) {
        if (active) {
          console.error("Gagal memuat sesi pemilih:", error);
          setAppError("Data pemilihan belum dapat dimuat. Periksa koneksi lalu muat ulang halaman.");
        }
      } finally {
        if (active) setReady(true);
      }
    }

    void loadSession();
    return () => {
      active = false;
    };
  }, []);

  const electionOrganizations = useMemo<typeof organizations>(() => {
    return organizations.map((organization) => ({
      ...organization,
      candidates:
        organization.id === "mpk"
          ? [
              ...new Map(
                (["chair", "vice"] as const)
                  .flatMap((position) => electionCandidates?.mpkMembers[position] ?? [])
                  .map((member) => [member.id, member] as const),
              ).values(),
            ].map((member, index) => ({
              id: member.id,
              name: member.name,
              viceName: "",
              number: "",
              className: "",
              initials: member.name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase(),
              color: ["rose", "blue", "yellow", "mint", "peach", "lilac"][index % 6],
              program: "",
              motto: "",
            }))
          : organization.candidates.map((candidate) => {
              const configured = electionCandidates?.organizations[organization.id].find(
                (item) => item.id === candidate.id,
              );
              return {
                ...candidate,
                ...(configured
                  ? {
                      name: configured.name,
                      viceName: configured.viceName,
                      number: configured.number,
                      photoDataUrl: configured.photoDataUrl,
                      vision: configured.vision,
                      mission: configured.mission,
                      initials: configured.name
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase(),
                    }
                  : {}),
              };
            }),
    }));
  }, [electionCandidates]);
  const currentOrganization = useMemo(
    () => electionOrganizations.find((organization) => organization.id === activeOrganization)!,
    [activeOrganization, electionOrganizations],
  );
  const votedCount = Object.keys(votes).length;
  const allVoted = votedCount === electionOrganizations.length;

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanNis = nis.trim();
    const adminLogin = cleanNis.toLocaleLowerCase("en-US") === "admin";
    if (!cleanNis) {
      setLoginError("NIS wajib diisi.");
      return;
    }
    if (adminLogin && !adminPasswordStep) {
      setAdminPasswordStep(true);
      setPassword("");
      setLoginError("");
      return;
    }
    if (adminLogin && !password) {
      setLoginError("Password admin wajib diisi.");
      return;
    }
    setLoginError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          adminLogin
            ? { username: "admin", password }
            : { nis: cleanNis },
        ),
      });
      const data = (await response.json()) as {
        role?: "student" | "admin";
        voter?: { name: string };
        votedOrganizations?: OrganizationId[];
        mpkSelections?: MpkSelections;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Login tidak berhasil.");

      setRole(data.role ?? "student");
      setVoter(data.voter?.name ?? "");
      setVotes(toVoteRecord(data.votedOrganizations ?? []));
      setMpkSelections(data.mpkSelections ?? { chair: null, vice: null });
      setActiveOrganization("mpk");
      setSelectedMpkPosition("chair");
      setSelectedCandidate("");
      setNis("");
      setPassword("");
      setAdminPasswordStep(false);
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "Tidak dapat terhubung ke server pemilihan. Silakan coba lagi.",
      );
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    setAppError("");
    const response = await fetch("/api/auth/session", { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(data.error ?? "Sesi belum dapat diakhiri. Silakan coba lagi.");
    setVoter("");
    setRole(null);
    setVotes({});
    setMpkSelections({ chair: null, vice: null });
    setActiveOrganization("mpk");
    setSelectedMpkPosition("chair");
    setSelectedCandidate("");
    setAdminPasswordStep(false);
    setPassword("");
  }

  async function submitVote() {
    if (!selectedCandidate || votes[activeOrganization]) return;
    setIsSubmitting(true);
    setAppError("");
    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: activeOrganization,
          ...(activeOrganization === "mpk"
            ? { position: selectedMpkPosition, memberId: selectedCandidate }
            : { candidateId: selectedCandidate }),
        }),
      });
      const data = (await response.json()) as {
        votedOrganizations?: OrganizationId[];
        mpkSelections?: MpkSelections;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Suara belum dapat disimpan.");

      setVotes(toVoteRecord(data.votedOrganizations ?? []));
      setMpkSelections(data.mpkSelections ?? { chair: null, vice: null });
      setSelectedCandidate("");
      setShowConfirmation(false);
    } catch (error) {
      setAppError(
        error instanceof Error
          ? error.message
          : "Tidak dapat menyimpan suara ke database. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedCandidateDetails = currentOrganization.candidates.find(
    (candidate) => candidate.id === selectedCandidate,
  );
  const mpkPosterPosition: MpkPosition | null =
    role === "student" && activeOrganization === "mpk" && !votes.mpk
      ? !mpkSelections.chair
        ? "chair"
        : !mpkSelections.vice
          ? "vice"
          : null
      : null;
  const isMpkPoster = mpkPosterPosition !== null;
  const mpkPosterCandidates = mpkPosterPosition
    ? electionCandidates?.mpkMembers[mpkPosterPosition] ?? []
    : [];
  const mpkPosterPositionLabel = mpkPosterPosition === "vice" ? "wakil ketua" : "ketua";

  if (!ready) return <main className="loading-screen" aria-label="Memuat aplikasi" />;

  if (!role) {
    const showAdminPasswordStep =
      nis.trim().toLocaleLowerCase("en-US") === "admin" && adminPasswordStep;
    return (
      <main className="login-page">
        <div className="login-wrap">
          <a className="brand" href="#" aria-label="Suara Mandara">
            <Image
              className="login-brand-logo"
              src="/logo-smk-negeri-bali-mandara.png"
              alt="Lambang SMK Negeri Bali Mandara"
              width={64}
              height={64}
              priority
            />
            <span className="login-brand-copy">
              <strong>Suara Mandara</strong>
              <small>SMK Negeri Bali Mandara</small>
            </span>
          </a>

          <section className="login-card">
            <div className="login-visual">
              <span className="eyebrow"><span className="live-dot" /> PEMILIHAN SISWA 2026/2027</span>
              <div className="visual-heading">
                <h1>AYO PILIH<br />SESUAI ISI<br /><span>HATIMU</span></h1>
                <p>Setiap pilihan punya arti. Yuk, tentukan pemimpin yang paling mewakili harapanmu.</p>
              </div>
              <div className="visual-bottom">
                <span className="visual-decoration visual-decoration-one" aria-hidden="true" />
                <span className="visual-decoration visual-decoration-two" aria-hidden="true" />
                <div className="election-note">
                  <span className="election-note-icon" aria-hidden="true">✓</span>
                  <span><strong>Satu suara berarti</strong><small>MPK&nbsp; · &nbsp;OSIS&nbsp; · &nbsp;KY</small></span>
                </div>
                <span className="visual-footnote">PEMILIHAN ORGANISASI KESISWAAN SEKOLAH</span>
              </div>
            </div>

            <div className="login-form-panel">
              <div className="form-topline">
                <span>{showAdminPasswordStep ? "PORTAL ADMIN" : "PORTAL PEMILIH"}</span>
                <span className="secure-label"><span>✦</span> SUARA MANDARA</span>
              </div>
              <div className="form-heading">
                <span className="form-icon">{showAdminPasswordStep ? "▣" : "↗"}</span>
                <p>{showAdminPasswordStep ? "Selamat datang, admin!" : "Selamat datang, pemilih!"}</p>
                <h2>
                  {showAdminPasswordStep ? <>Masukkan password<br />admin.</> : <>Mulai dari<br />suaramu.</>}
                </h2>
                <span className="form-subtitle">
                  {showAdminPasswordStep
                    ? "Masukkan password untuk membuka rekap suara."
                    : "Masukkan NIS untuk melanjutkan pemilihan."}
                </span>
              </div>
              <form className="login-form" onSubmit={handleLogin}>
                {showAdminPasswordStep ? (
                  <>
                    <div className="admin-account">
                      <span className="admin-account-avatar">A</span>
                      <span><strong>admin</strong><small>Masuk sebagai pengelola</small></span>
                      <button
                        type="button"
                        className="change-admin-button"
                        onClick={() => {
                          setAdminPasswordStep(false);
                          setPassword("");
                          setLoginError("");
                        }}
                      >
                        Kembali
                      </button>
                    </div>
                    <label htmlFor="admin-password">Password admin</label>
                    <div className="input-wrap">
                      <span className="input-icon lock-icon" aria-hidden="true">▣</span>
                      <input
                        ref={adminPasswordRef}
                        id="admin-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Masukkan password admin"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <label htmlFor="nis">Nomor Induk Siswa (NIS)</label>
                    <div className="input-wrap">
                      <span className="input-icon nis-icon" aria-hidden="true">#</span>
                      <input
                        id="nis"
                        name="nis"
                        type="text"
                        inputMode="text"
                        autoCapitalize="none"
                        autoComplete="off"
                        placeholder="Masukkan NIS kamu"
                        value={nis}
                        onChange={(event) => {
                          setNis(event.target.value);
                          setAdminPasswordStep(false);
                          setLoginError("");
                          setPassword("");
                        }}
                        required
                      />
                    </div>
                  </>
                )}
                {loginError && <p className="form-error" role="alert">{loginError}</p>}
                {appError && <p className="form-error" role="alert">{appError}</p>}
                <button className="primary-button login-button" type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Memeriksa data..."
                    : showAdminPasswordStep
                      ? "Masuk ke halaman admin"
                      : "Masuk & mulai memilih"} <span aria-hidden="true">→</span>
                </button>
              </form>
              <p className="login-hint"><span>✳</span> Gunakan hak pilihmu dengan bijak untuk menentukan pemimpin organisasi kesiswaan.</p>
              <p className="demo-notice">Setiap suara berharga. Pilih calon yang paling mewakili aspirasi siswa.</p>
              <div className="login-footer"><span>© 2026 Suara Mandara</span><span>Suaramu berarti <span className="heart">♥</span></span></div>
            </div>
          </section>
          <div className="login-bottom-note"><span className="tiny-spark">✳</span> SATU SISWA, SATU SUARA, SATU MANDARA.</div>
        </div>
      </main>
    );
  }

  if (role === "admin") {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <main className="app-page">
      <header className="app-header">
        <a className="brand" href="#" aria-label="Suara Mandara">
          <span className="brand-mark"><span /></span>
          <span className="brand-copy">suara<span>mandara</span></span>
        </a>
        <span className="header-election"><span className="live-dot" /> PEMILIHAN SISWA 2026/2027</span>
        <button className="profile-button" onClick={() => {
          void handleLogout().catch((error: unknown) => {
            setAppError(error instanceof Error ? error.message : "Gagal keluar dari aplikasi.");
          });
        }} title="Keluar">
          <span className="profile-avatar">{voter.slice(0, 2).toUpperCase()}</span>
          <span className="profile-name">{voter}<small>Pemilih</small></span>
          <span className="logout-icon" aria-hidden="true">↗</span>
        </button>
      </header>

      <div className={`app-content ${isMpkPoster ? "mpk-poster-content" : ""}`}>
        {isMpkPoster ? (
          <section className="mpk-poster-page" aria-labelledby="mpk-poster-title">
            <header className="mpk-poster-heading">
              <span className="eyebrow dark-eyebrow"><span className="live-dot" /> PEMILIHAN CALON {mpkPosterPositionLabel.toUpperCase()} MPK 2026/2027</span>
              <h1 id="mpk-poster-title">Kenali calon {mpkPosterPositionLabel} MPK</h1>
              <p>Pilih dengan cermat calon yang paling mewakili aspirasi kelasmu.</p>
              <div className="mpk-poster-notice" role="note">
                Foto atau visi-misi yang belum diatur admin ditampilkan sebagai ilustrasi atau contoh. Hanya calon terdaftar yang dapat dipilih.
              </div>
              <span className="mpk-poster-count">
                {mpkPosterCandidates.length} calon terdaftar
              </span>
            </header>
            {appError && <p className="form-error app-error" role="alert">{appError}</p>}
            <div className="mpk-poster-grid">
              {Array.from({ length: Math.max(10, mpkPosterCandidates.length) }, (_, index) => {
                const candidate = mpkPosterCandidates[index];
                const program = mpkPosterPrograms[index % mpkPosterPrograms.length];
                const candidateName =
                  candidate?.name ??
                  `Calon ${mpkPosterPositionLabel} ${String(index + 1).padStart(2, "0")}`;
                const vision = candidate?.vision.trim() || "";
                const mission = candidate?.mission.trim() || "";
                const isSelected = candidate?.id === selectedCandidate;
                return (
                  <button
                    className={`mpk-poster-card ${isSelected ? "selected" : ""} ${candidate ? "" : "unregistered"}`}
                    key={candidate?.id ?? `mpk-chair-placeholder-${index}`}
                    type="button"
                    disabled={!candidate || isSubmitting}
                    onClick={() => {
                      if (!candidate) return;
                      setSelectedMpkPosition("chair");
                      setSelectedCandidate(candidate.id);
                    }}
                    aria-pressed={Boolean(candidate && isSelected)}
                  >
                    <span className="mpk-poster-card-top">
                      <span>CALON {mpkPosterPositionLabel.toUpperCase()} MPK</span>
                      <strong>{String(index + 1).padStart(2, "0")}</strong>
                    </span>
                    <span className="mpk-poster-portrait" style={{ color: program.accent }}>
                      {candidate?.photoDataUrl ? (
                        <Image
                          className="mpk-poster-photo"
                          src={candidate.photoDataUrl}
                          alt={`Foto ${candidateName}`}
                          width={240}
                          height={240}
                          unoptimized
                        />
                      ) : (
                        <svg viewBox="0 0 160 160" aria-hidden="true">
                          <circle cx="80" cy="80" r="73" fill="rgba(255,255,255,.36)" />
                          <path d="M29 151c5-30 23-45 51-45s46 15 51 45" fill="currentColor" />
                          <path d="M49 65c0-23 13-38 32-38 20 0 32 15 32 38v13c0 23-13 39-32 39-19 0-32-16-32-39z" fill="#986b58" />
                          <path d="M48 69c-5-27 8-47 34-47 25 0 39 18 32 47-7-3-12-10-15-19-11 10-29 15-51 14z" fill="#29302d" />
                          <path d="M66 86h1m27 0h1" stroke="#382c28" strokeWidth="4" strokeLinecap="round" />
                          <path d="M72 101c5 4 11 4 16 0" fill="none" stroke="#70463d" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      )}
                      <span className="mpk-poster-photo-label">{candidate?.photoDataUrl ? "FOTO" : "ILUSTRASI"}</span>
                    </span>
                    <span className="mpk-poster-card-content">
                      <strong className="mpk-poster-name">{candidateName}</strong>
                      {!candidate && <span className="mpk-poster-unregistered">Belum terdaftar oleh admin</span>}
                      <span className="mpk-poster-copy-label">Visi{vision ? "" : " · Contoh"}</span>
                      <span className="mpk-poster-vision">{vision || program.vision}</span>
                      <span className="mpk-poster-copy-label">Misi{mission ? "" : " · Contoh"}</span>
                      <span className="mpk-poster-missions">
                        {(mission
                          ? mission.split(/\n+/).map((item) => item.trim()).filter(Boolean)
                          : program.missions
                        ).map((item) => <span key={item}>{item}</span>)}
                      </span>
                    </span>
                    <span className="mpk-poster-select">{isSelected ? "✓ Dipilih" : candidate ? "Pilih calon" : "Belum tersedia"}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <>
        {appError && <p className="form-error app-error" role="alert">{appError}</p>}
        <section className="welcome-strip">
          <div>
            <span className="eyebrow dark-eyebrow"><span className="live-dot" /> SAATNYA IKUT MENENTUKAN</span>
            <h1>Hai, {voter}! <span className="wave">✳</span></h1>
            <p>Pilih pemimpin yang paling mewakili harapanmu.</p>
          </div>
          <div className="progress-card">
            <div className="progress-copy"><span>PROGRES PEMILIHAN</span><strong>{votedCount}<small>/{electionOrganizations.length}</small></strong></div>
            <div className="progress-track"><span style={{ width: `${(votedCount / electionOrganizations.length) * 100}%` }} /></div>
            <span className="progress-caption">{allVoted ? "Semua pilihanmu sudah tercatat!" : `${electionOrganizations.length - votedCount} organisasi lagi untuk dipilih`}</span>
          </div>
        </section>

        <div className="voting-layout">
          <aside className="organization-sidebar">
            <div className="section-label">PILIH ORGANISASI</div>
            <div className="organization-list">
              {electionOrganizations.map((organization, index) => {
                const isActive = activeOrganization === organization.id;
                const hasVoted = Boolean(votes[organization.id]);
                return (
                  <button
                    key={organization.id}
                    className={`organization-option ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setActiveOrganization(organization.id);
                      setSelectedCandidate("");
                    }}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span className={`organization-icon ${organization.color}`}>{organization.initials}</span>
                    <span className="organization-copy"><strong>{organization.name}</strong><small>{organization.fullName}</small></span>
                    <span className={`organization-status ${hasVoted ? "done" : ""}`}>{hasVoted ? "✓" : `0${index + 1}`}</span>
                  </button>
                );
              })}
            </div>
            <div className="sidebar-note">
              <span className="note-star">✳</span>
              <strong>Ingat, ya!</strong>
              <p>Admin dapat melihat pilihan setiap siswa. Pilih dengan hati dan pikiran terbuka.</p>
            </div>
            <div className="sidebar-decoration" aria-hidden="true"><span>✳</span><span>✳</span><span>·</span></div>
          </aside>

          <section className="candidate-section">
            <div className="candidate-header">
              <div>
                <span className="eyebrow dark-eyebrow">KANDIDAT {currentOrganization.name}</span>
                <h2>{currentOrganization.fullName}</h2>
                <p>{currentOrganization.description}</p>
              </div>
              <span className="candidate-count">
                {activeOrganization === "mpk" ? currentOrganization.candidates.length : "03"}
                <span>{activeOrganization === "mpk" ? "ANGGOTA MPK" : "PASLON"}</span>
              </span>
            </div>
            {votes[activeOrganization] ? (
              <div className="already-voted">
                <span className="success-icon">✓</span>
                <h3>Suaramu untuk {currentOrganization.name} sudah tercatat!</h3>
                <p>Terima kasih sudah ikut menentukan masa depan sekolah kita.</p>
                {votedCount < electionOrganizations.length && (
                  <button className="text-button" onClick={() => {
                    const next = electionOrganizations.find((organization) => !votes[organization.id]);
                    if (next) setActiveOrganization(next.id);
                  }}>Pilih organisasi berikutnya <span>→</span></button>
                )}
              </div>
            ) : (
              activeOrganization === "mpk" ? (
                <>
                  <p className="mpk-vote-instructions">
                    Pilih satu anggota untuk setiap jabatan. Anggota yang sama boleh dipilih untuk kedua jabatan.
                  </p>
                  <div className="mpk-position-grid">
                    {(["chair", "vice"] as const).map((position) => {
                      const savedMemberId = mpkSelections[position];
                      const positionCandidates =
                        electionCandidates?.mpkMembers[position] ?? [];
                      const title =
                        position === "chair" ? "Calon Ketua MPK" : "Calon Wakil Ketua MPK";
                      return (
                        <section className="mpk-position-card" key={position}>
                          <div className="mpk-position-heading">
                            <h3>{title}</h3>
                            {savedMemberId ? (
                              <span className="mpk-choice-saved">Pilihan tercatat</span>
                            ) : (
                              <span>Belum memilih</span>
                            )}
                          </div>
                          {savedMemberId && (
                            <p className="mpk-selected-member">
                              {positionCandidates.find((candidate) => candidate.id === savedMemberId)
                                ?.name ?? "Anggota MPK"}
                            </p>
                          )}
                          {!savedMemberId && (
                            <div className="mpk-member-list">
                              {positionCandidates.map((candidate, index) => {
                                const initials = candidate.name
                                  .trim()
                                  .split(/\s+/)
                                  .slice(0, 2)
                                  .map((part) => part[0])
                                  .join("")
                                  .toUpperCase();
                                const colors = ["rose", "blue", "yellow", "mint", "peach", "lilac"];
                                return (
                              <button
                                type="button"
                                key={candidate.id}
                                className={`mpk-member-option ${
                                  selectedCandidate === candidate.id &&
                                  selectedMpkPosition === position
                                    ? "selected"
                                    : ""
                                }`}
                                disabled={Boolean(savedMemberId) || isSubmitting}
                                onClick={() => {
                                  setSelectedMpkPosition(position);
                                  setSelectedCandidate(candidate.id);
                                }}
                                aria-pressed={
                                  selectedCandidate === candidate.id &&
                                  selectedMpkPosition === position
                                }
                              >
                                <span className={`mpk-member-avatar ${colors[index % colors.length]}`}>
                                  {initials}
                                </span>
                                <strong>{candidate.name}</strong>
                                <span className="mpk-member-check">
                                  {savedMemberId === candidate.id
                                    ? "✓"
                                    : selectedCandidate === candidate.id &&
                                        selectedMpkPosition === position
                                      ? "✓"
                                      : ""}
                                </span>
                              </button>
                                );
                              })}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                  <div className="voting-action">
                    <span><span className="small-lock">▣</span> Setiap pilihan jabatan hanya bisa dikirim satu kali.</span>
                    <button
                      className="primary-button vote-button"
                      disabled={
                        !selectedCandidate ||
                        Boolean(mpkSelections[selectedMpkPosition]) ||
                        isSubmitting
                      }
                      onClick={() => setShowConfirmation(true)}
                    >
                      {selectedCandidate
                        ? `Pilih sebagai ${selectedMpkPosition === "chair" ? "ketua" : "wakil"}`
                        : "Pilih anggota"} <span>→</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="candidate-grid">
                    {currentOrganization.candidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        className={`candidate-card ${selectedCandidate === candidate.id ? "selected" : ""}`}
                        onClick={() => setSelectedCandidate(candidate.id)}
                        aria-pressed={selectedCandidate === candidate.id}
                      >
                        <span className="candidate-number">PASLON <strong>{candidate.number}</strong></span>
                        <span className={`candidate-photo ${candidate.color}`}>
                          {candidate.photoDataUrl ? (
                            <Image
                              className="candidate-photo-image"
                              src={candidate.photoDataUrl}
                              alt={`Foto pasangan ${candidate.name} dan ${candidate.viceName}`}
                              width={320}
                              height={240}
                              unoptimized
                            />
                          ) : (
                            <>
                              <span className="portrait-initials">{candidate.initials}</span>
                              <span className="candidate-photo-label">ILUSTRASI</span>
                            </>
                          )}
                          <span className="photo-spark">✳</span>
                          <span className="photo-orbit" />
                        </span>
                        <span className="candidate-info">
                          <span className="candidate-role">Calon ketua</span>
                          <strong className="candidate-name">{candidate.name}</strong>
                          <span className="candidate-class">{candidate.className}</span>
                          <span className="candidate-vice-divider" />
                          <span className="candidate-role">Calon wakil ketua</span>
                          <strong className="candidate-vice-name">{candidate.viceName}</strong>
                          <span className="candidate-program">
                            <small>Visi{candidate.vision ? "" : " · Contoh"}</small>
                            {candidate.vision || candidate.program}
                          </span>
                        </span>
                        <span className="candidate-motto">
                          <small>Misi{candidate.mission ? "" : " · Contoh"}</small>
                          {candidate.mission || candidate.motto}
                        </span>
                        <span className="select-indicator">{selectedCandidate === candidate.id ? "✓" : ""}</span>
                      </button>
                    ))}
                  </div>
                  <div className="voting-action">
                    <span><span className="small-lock">▣</span> Pilihanmu tercatat dan tidak dapat diubah.</span>
                    <button
                      className="primary-button vote-button"
                      disabled={!selectedCandidate}
                      onClick={() => setShowConfirmation(true)}
                    >{selectedCandidate ? "Lanjutkan pilihan" : "Pilih kandidat dulu"} <span>→</span></button>
                  </div>
                </>
              )
            )}
          </section>
        </div>
        <footer className="app-footer"><span>© 2026 SUARA MANDARA</span><span>Satu siswa, satu suara, satu perubahan. <span className="heart">♥</span></span></footer>
        <p className="demo-footer-note">Suara disimpan di database SQLite pada server sekolah.</p>
          </>
        )}
      </div>

      {isMpkPoster && (
        <div className="mpk-poster-action-bar">
          <div className="mpk-poster-action-copy">
            <strong>{selectedCandidateDetails?.name ?? `Pilih calon ${mpkPosterPositionLabel} MPK`}</strong>
            <span>{selectedCandidateDetails ? "Periksa pilihan sebelum mengirim suara." : "Pilih satu calon yang terdaftar untuk melanjutkan."}</span>
          </div>
          <button
            className="primary-button mpk-poster-action-button"
            type="button"
            disabled={!selectedCandidateDetails || isSubmitting}
            onClick={() => setShowConfirmation(true)}
          >
            {mpkPosterPosition === "chair" ? "Pilih calon ketua & lanjutkan" : "Pilih calon wakil & lanjutkan"} <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {showConfirmation && selectedCandidateDetails && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowConfirmation(false);
        }}>
          <section className="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <button className="modal-close" onClick={() => setShowConfirmation(false)} aria-label="Tutup">×</button>
            <span className={`modal-candidate-avatar ${selectedCandidateDetails.color}`}>{selectedCandidateDetails.initials}</span>
            <span className="eyebrow dark-eyebrow">KONFIRMASI PILIHAN</span>
            <h2 id="confirm-title">Sudah yakin dengan pilihanmu?</h2>
            <p>
              {activeOrganization === "mpk" ? (
                <>
                  Kamu memilih <strong>{selectedCandidateDetails.name}</strong> sebagai calon{" "}
                  {selectedMpkPosition === "chair" ? "ketua" : "wakil ketua"} MPK. Pilihan untuk
                  jabatan ini tidak dapat diubah setelah dikirim.
                </>
              ) : (
                <>
                  Kamu memilih pasangan{" "}
                  <strong>{selectedCandidateDetails.name} dan {selectedCandidateDetails.viceName}</strong>{" "}
                  sebagai calon ketua dan wakil ketua {currentOrganization.name}. Setelah dikirim,
                  pilihan tidak bisa diubah.
                </>
              )}
            </p>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setShowConfirmation(false)}>Lihat lagi</button>
              <button className="primary-button" onClick={submitVote} disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Ya, kirim suara"} <span>→</span>
              </button>
            </div>
            <span className="demo-modal-note">Suara disimpan dengan aman dan tidak dapat diubah.</span>
          </section>
        </div>
      )}
    </main>
  );
}
