"use client";

import { useEffect, useMemo, useState } from "react";

type OrganizationId = "mpk" | "osis" | "ky";
type Candidate = {
  id: string;
  name: string;
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

const STORAGE_KEY = "suara-kita-demo-votes";

type VoteRecord = Partial<Record<OrganizationId, string>>;

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [voter, setVoter] = useState("");
  const [activeOrganization, setActiveOrganization] =
    useState<OrganizationId>("mpk");
  const [votes, setVotes] = useState<VoteRecord>({});
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const savedVotes = localStorage.getItem(STORAGE_KEY);
        if (savedVotes) setVotes(JSON.parse(savedVotes) as VoteRecord);
        setVoter(sessionStorage.getItem("suara-kita-voter") ?? "");
      } catch (error) {
        console.error("Gagal memuat data simulasi pemilihan:", error);
      } finally {
        if (active) setReady(true);
      }
    });
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

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setLoginError("Username dan password wajib diisi.");
      return;
    }
    setLoginError("");
    setVoter(cleanUsername);
    sessionStorage.setItem("suara-kita-voter", cleanUsername);
    setPassword("");
  }

  function handleLogout() {
    sessionStorage.removeItem("suara-kita-voter");
    setVoter("");
  }

  function submitVote() {
    if (!selectedCandidate || votes[activeOrganization]) return;
    const nextVotes = { ...votes, [activeOrganization]: selectedCandidate };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextVotes));
      setVotes(nextVotes);
      setSelectedCandidate("");
      setShowConfirmation(false);
    } catch (error) {
      console.error("Gagal menyimpan suara simulasi:", error);
    }
  }

  const selectedCandidateDetails = currentOrganization.candidates.find(
    (candidate) => candidate.id === selectedCandidate,
  );

  if (!ready) return <main className="loading-screen" aria-label="Memuat aplikasi" />;

  if (!voter) {
    return (
      <main className="login-page">
        <div className="login-wrap">
          <a className="brand" href="#" aria-label="Suara Kita">
            <span className="brand-mark"><span /></span>
            <span className="brand-copy">suara<span>kita</span></span>
          </a>

          <section className="login-card">
            <div className="login-visual">
              <span className="eyebrow"><span className="live-dot" /> PEMILIHAN SISWA 2026/2027</span>
              <div className="visual-heading">
                <h1>Suaramu,<br />masa depan<br /><span>kita.</span></h1>
                <p>Satu suara kecil bisa membawa perubahan besar untuk sekolah kita.</p>
              </div>
              <div className="visual-bottom">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <div className="orbit orbit-three" />
                <span className="orbit-star star-one">✳</span>
                <span className="orbit-star star-two">✳</span>
                <div className="vote-stamp"><span>01</span><span>SUARA<br />KAMU</span></div>
                <div className="candidate-avatars" aria-hidden="true">
                  <span className="avatar avatar-one">NP</span>
                  <span className="avatar avatar-two">DS</span>
                  <span className="avatar avatar-three">KA</span>
                </div>
                <span className="avatar-note">Calon pemimpin<br />masa depan ✦</span>
                <span className="visual-footnote">MPK &nbsp;·&nbsp; OSIS &nbsp;·&nbsp; KY</span>
              </div>
            </div>

            <div className="login-form-panel">
              <div className="form-topline">
                <span>PORTAL PEMILIH</span>
                <span className="secure-label"><span>✦</span> AMAN &amp; MUDAH</span>
              </div>
              <div className="form-heading">
                <span className="form-icon">↗</span>
                <p>Halo, pemilih!</p>
                <h2>Siap menentukan<br />pilihanmu?</h2>
                <span className="form-subtitle">Masuk dulu, yuk. Masa depan sekolah dimulai di sini.</span>
              </div>
              <form className="login-form" onSubmit={handleLogin}>
                <label htmlFor="username">Username</label>
                <div className="input-wrap">
                  <span className="input-icon" aria-hidden="true">♙</span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Masukkan username kamu"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />
                </div>
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <span className="input-icon lock-icon" aria-hidden="true">▣</span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
                {loginError && <p className="form-error" role="alert">{loginError}</p>}
                <button className="primary-button login-button" type="submit">
                  Masuk &amp; mulai memilih <span aria-hidden="true">→</span>
                </button>
              </form>
              <p className="login-hint"><span>✳</span> Gunakan akun pemilih yang diberikan oleh sekolahmu.</p>
              <p className="demo-notice">Mode demo: formulir dapat dicoba tanpa akun backend.</p>
              <div className="login-footer"><span>© 2026 Suara Kita</span><span>Dibuat untuk perubahan yang baik <span className="heart">♥</span></span></div>
            </div>
          </section>
          <div className="login-bottom-note"><span className="tiny-spark">✳</span> SATU SISWA, SATU SUARA, SATU PERUBAHAN.</div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <header className="app-header">
        <a className="brand" href="#" aria-label="Suara Kita">
          <span className="brand-mark"><span /></span>
          <span className="brand-copy">suara<span>kita</span></span>
        </a>
        <span className="header-election"><span className="live-dot" /> PEMILIHAN SISWA 2026/2027</span>
        <button className="profile-button" onClick={handleLogout} title="Keluar">
          <span className="profile-avatar">{voter.slice(0, 2).toUpperCase()}</span>
          <span className="profile-name">{voter}<small>Pemilih</small></span>
          <span className="logout-icon" aria-hidden="true">↗</span>
        </button>
      </header>

      <div className="app-content">
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
              <p>Pilihanmu bersifat rahasia. Pilih dengan hati dan pikiran terbuka.</p>
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
              <span className="candidate-count">03 <span>KANDIDAT</span></span>
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
                      <span className="candidate-number">KANDIDAT <strong>{candidate.number}</strong></span>
                      <span className={`candidate-photo ${candidate.color}`}>
                        <span className="portrait-initials">{candidate.initials}</span>
                        <span className="photo-spark">✳</span>
                        <span className="photo-orbit" />
                      </span>
                      <span className="candidate-info">
                        <strong className="candidate-name">{candidate.name}</strong>
                        <span className="candidate-class">{candidate.className}</span>
                        <span className="candidate-program">{candidate.program}</span>
                      </span>
                      <span className="candidate-motto">“{candidate.motto}”</span>
                      <span className="select-indicator">{selectedCandidate === candidate.id ? "✓" : ""}</span>
                    </button>
                  ))}
                </div>
                <div className="voting-action">
                  <span><span className="small-lock">▣</span> Pilihanmu bersifat rahasia dan tidak dapat diubah.</span>
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
        <footer className="app-footer"><span>© 2026 SUARA KITA</span><span>Satu siswa, satu suara, satu perubahan. <span className="heart">♥</span></span></footer>
        <p className="demo-footer-note">Prototipe demo — data pemilihan tersimpan hanya di browser ini dan bukan suara resmi.</p>
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
            <p>Kamu memilih <strong>{selectedCandidateDetails.name}</strong> sebagai ketua {currentOrganization.name}. Setelah dikirim, pilihan tidak bisa diubah.</p>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setShowConfirmation(false)}>Lihat lagi</button>
              <button className="primary-button" onClick={submitVote}>Ya, kirim suara <span>→</span></button>
            </div>
            <span className="demo-modal-note">Simulasi demo — tidak dikirim ke server.</span>
          </section>
        </div>
      )}
    </main>
  );
}
