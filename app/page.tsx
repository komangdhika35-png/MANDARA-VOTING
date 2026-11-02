"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { OrganizationId } from "@/lib/election";
import AdminDashboard from "@/app/admin-dashboard";

type Candidate = {
  id: string;
  name: string;
  viceName: string;
  className: string;
  number: string;
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
    description: "Suara perwakilan untuk sekolah yang lebih baik.",
    color: "lilac",
    initials: "M",
    candidates: [
      {
        id: "mpk-1",
        name: "Nadia Putri",
        viceName: "Rizky Aditya",
        className: "XI IPA 2",
        number: "01",
        initials: "NP",
        color: "rose",
        program: "Ruang aspirasi yang terbuka, rutin, dan benar-benar didengar.",
        motto: "Dengar, wakili, wujudkan.",
      },
      {
        id: "mpk-2",
        name: "Raka Pratama",
        viceName: "Nabila Safitri",
        className: "XI IPS 1",
        number: "02",
        initials: "RP",
        color: "blue",
        program: "Forum kelas bulanan dan laporan aspirasi yang transparan.",
        motto: "Setiap suara punya arti.",
      },
      {
        id: "mpk-3",
        name: "Salsabila A.",
        viceName: "Farhan Maulana",
        className: "X IPA 3",
        number: "03",
        initials: "SA",
        color: "yellow",
        program: "Jembatan komunikasi yang hangat antara siswa dan sekolah.",
        motto: "Aspirasi jadi aksi.",
      },
    ],
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
  const [selectedCandidate, setSelectedCandidate] = useState("");
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
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (response.status === 401) return;

        const data = (await response.json()) as {
          role?: "student" | "admin";
          voter?: { name: string };
          votedOrganizations?: OrganizationId[];
          error?: string;
        };
        if (!response.ok) throw new Error(data.error ?? "Gagal memuat sesi pemilih.");
        if (!active) return;

        setRole(data.role ?? "student");
        setVoter(data.voter?.name ?? "");
        setVotes(toVoteRecord(data.votedOrganizations ?? []));
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

  const currentOrganization = useMemo(
    () => organizations.find((organization) => organization.id === activeOrganization)!,
    [activeOrganization],
  );
  const votedCount = Object.keys(votes).length;
  const allVoted = votedCount === organizations.length;

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
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Login tidak berhasil.");

      setRole(data.role ?? "student");
      setVoter(data.voter?.name ?? "");
      setVotes(toVoteRecord(data.votedOrganizations ?? []));
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
          candidateId: selectedCandidate,
        }),
      });
      const data = (await response.json()) as {
        votedOrganizations?: OrganizationId[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Suara belum dapat disimpan.");

      setVotes(toVoteRecord(data.votedOrganizations ?? []));
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

      <div className="app-content">
        {appError && <p className="form-error app-error" role="alert">{appError}</p>}
        <section className="welcome-strip">
          <div>
            <span className="eyebrow dark-eyebrow"><span className="live-dot" /> SAATNYA IKUT MENENTUKAN</span>
            <h1>Hai, {voter}! <span className="wave">✳</span></h1>
            <p>Pilih pemimpin yang paling mewakili harapanmu.</p>
          </div>
          <div className="progress-card">
            <div className="progress-copy"><span>PROGRES PEMILIHAN</span><strong>{votedCount}<small>/{organizations.length}</small></strong></div>
            <div className="progress-track"><span style={{ width: `${(votedCount / organizations.length) * 100}%` }} /></div>
            <span className="progress-caption">{allVoted ? "Semua pilihanmu sudah tercatat!" : `${organizations.length - votedCount} organisasi lagi untuk dipilih`}</span>
          </div>
        </section>

        <div className="voting-layout">
          <aside className="organization-sidebar">
            <div className="section-label">PILIH ORGANISASI</div>
            <div className="organization-list">
              {organizations.map((organization, index) => {
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
              <span className="candidate-count">03 <span>PASLON</span></span>
            </div>
            {votes[activeOrganization] ? (
              <div className="already-voted">
                <span className="success-icon">✓</span>
                <h3>Suaramu untuk {currentOrganization.name} sudah tercatat!</h3>
                <p>Terima kasih sudah ikut menentukan masa depan sekolah kita.</p>
                {votedCount < organizations.length && (
                  <button className="text-button" onClick={() => {
                    const next = organizations.find((organization) => !votes[organization.id]);
                    if (next) setActiveOrganization(next.id);
                  }}>Pilih organisasi berikutnya <span>→</span></button>
                )}
              </div>
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
                        <span className="portrait-initials">{candidate.initials}</span>
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
                        <span className="candidate-program">{candidate.program}</span>
                      </span>
                      <span className="candidate-motto">“{candidate.motto}”</span>
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
            )}
          </section>
        </div>
        <footer className="app-footer"><span>© 2026 SUARA MANDARA</span><span>Satu siswa, satu suara, satu perubahan. <span className="heart">♥</span></span></footer>
        <p className="demo-footer-note">Suara disimpan di database SQLite pada server sekolah.</p>
      </div>

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
              Kamu memilih pasangan <strong>{selectedCandidateDetails.name} dan {selectedCandidateDetails.viceName}</strong> sebagai calon ketua dan wakil ketua {currentOrganization.name}. Setelah dikirim, pilihan tidak bisa diubah.
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
