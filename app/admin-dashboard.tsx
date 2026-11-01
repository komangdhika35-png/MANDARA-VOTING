"use client";

import { useCallback, useEffect, useState } from "react";

type OrganizationResult = {
  id: string;
  name: string;
  fullName: string;
  totalVotes: number;
  candidates: { id: string; name: string; viceName: string; votes: number }[];
  voters: { nis: string; name: string; candidateName: string }[];
  abstainers: string[];
};

type Results = {
  organizations: OrganizationResult[];
  totalVotes: number;
};

export default function AdminDashboard({ onLogout }: { onLogout: () => Promise<void> }) {
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [logoutError, setLogoutError] = useState("");
  const [resetTarget, setResetTarget] = useState<{
    nis: string;
    name: string;
    candidateName: string;
    organizationId: string;
    organizationName: string;
  } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  async function handleLogout() {
    setLogoutError("");
    try {
      await onLogout();
    } catch (logoutFailure) {
      setLogoutError(
        logoutFailure instanceof Error ? logoutFailure.message : "Gagal keluar dari aplikasi.",
      );
    }
  }

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/results", { cache: "no-store" });
      const data = (await response.json()) as Results & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Gagal memuat rekap suara.");
      setResults(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Tidak dapat terhubung ke database.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  async function resetVote() {
    if (!resetTarget) return;
    setResetting(true);
    setResetError("");
    setResetMessage("");
    try {
      const response = await fetch("/api/admin/reset-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nis: resetTarget.nis,
          organizationId: resetTarget.organizationId,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Suara belum dapat direset.");

      setResetMessage(
        `Suara ${resetTarget.name} untuk ${resetTarget.organizationName} sudah direset. Siswa perlu masuk kembali untuk memilih ulang.`,
      );
      setResetTarget(null);
      await loadResults();
    } catch (resetFailure) {
      setResetError(
        resetFailure instanceof Error
          ? resetFailure.message
          : "Tidak dapat mereset suara. Silakan coba lagi.",
      );
    } finally {
      setResetting(false);
    }
  }

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadResults();
    });
    return () => {
      active = false;
    };
  }, [loadResults]);

  return (
    <main className="app-page admin-page">
      <header className="app-header">
        <a className="brand" href="#" aria-label="Suara Mandara">
          <span className="brand-mark"><span /></span>
          <span className="brand-copy">suara<span>mandara</span></span>
        </a>
        <button className="profile-button" onClick={() => void handleLogout()} title="Keluar">
          <span className="profile-avatar">AD</span>
          <span className="profile-name">Admin<small>Pengelola hasil</small></span>
          <span className="logout-icon" aria-hidden="true">↗</span>
        </button>
      </header>

      <div className="app-content admin-content">
        <section className="admin-welcome">
          <div>
            <span className="eyebrow dark-eyebrow"><span className="live-dot" /> HALAMAN ADMIN</span>
            <h1>Rekap suara</h1>
            <p>Ringkasan pilihan untuk setiap organisasi.</p>
          </div>
          <button className="secondary-button refresh-button" onClick={() => void loadResults()} disabled={loading}>
            <span aria-hidden="true">↻</span> {loading ? "Memuat..." : "Perbarui rekap"}
          </button>
        </section>

        {logoutError && <p className="form-error app-error" role="alert">{logoutError}</p>}
        {error && <p className="form-error app-error" role="alert">{error}</p>}
        {resetError && <p className="form-error app-error" role="alert">{resetError}</p>}
        {resetMessage && <p className="admin-reset-notice" role="status">{resetMessage}</p>}

        <section className="admin-total-card" aria-live="polite">
          <span className="admin-total-icon" aria-hidden="true">✓</span>
          <span><small>TOTAL SUARA TERCATAT</small><strong>{loading && !results ? "—" : results?.totalVotes ?? 0}</strong></span>
          <span className="admin-total-caption">Data diambil langsung dari database SQLite</span>
        </section>
        <p className="admin-privacy-notice" role="note">
          Privasi: halaman ini menampilkan nama siswa beserta pilihannya. Batasi akses halaman ini hanya untuk admin.
        </p>

        <section className="results-grid" aria-label="Rekap suara tiap organisasi">
          {results?.organizations.map((organization) => {
            const leader = organization.candidates.reduce(
              (current, candidate) => candidate.votes > current.votes ? candidate : current,
              organization.candidates[0],
            );
            return (
              <article className="results-card" key={organization.id}>
                <header className="results-card-header">
                  <span className={`organization-icon ${organization.id === "mpk" ? "lilac" : organization.id === "osis" ? "mint" : "peach"}`}>
                    {organization.name.charAt(0)}
                  </span>
                  <span className="results-organization-title">
                    <strong>{organization.name}</strong>
                    <small>{organization.fullName}</small>
                  </span>
                  <span className="results-total"><strong>{organization.totalVotes}</strong><small>suara</small></span>
                </header>
                <div className="results-candidates">
                  {organization.candidates.map((candidate, index) => {
                    const percentage = organization.totalVotes
                      ? Math.round((candidate.votes / organization.totalVotes) * 100)
                      : 0;
                    return (
                      <div className="result-candidate" key={candidate.id}>
                        <div className="result-candidate-copy">
                          <span>
                            <small className="result-number">0{index + 1}</small>
                            <span className="result-team-names">
                              <strong>{candidate.name}</strong>
                              <small>Wakil: {candidate.viceName}</small>
                            </span>
                          </span>
                          <strong>{candidate.votes} <small>({percentage}%)</small></strong>
                        </div>
                        <div
                          className="result-track"
                          role="progressbar"
                          aria-label={`Suara untuk ${candidate.name}`}
                          aria-valuenow={percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <span style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <details className="voter-details">
                  <summary>Pemilih dan pilihannya ({organization.voters.length})</summary>
                  {organization.voters.length > 0 ? (
                    <ul>
                      {organization.voters.map((voter) => (
                        <li className="admin-voter-row" key={voter.nis}>
                          <span className="admin-voter-copy">
                            <strong>{voter.name}</strong>
                            <small>NIS: {voter.nis}</small>
                            <span>{voter.candidateName}</span>
                          </span>
                          <button
                            className="reset-vote-button"
                            onClick={() => {
                              setResetError("");
                              setResetTarget({
                                ...voter,
                                organizationId: organization.id,
                                organizationName: organization.name,
                              });
                            }}
                            aria-label={`Reset suara ${voter.name} untuk ${organization.name}`}
                          >
                            Reset
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Belum ada siswa yang memilih.</p>
                  )}
                </details>
                <details className="voter-details abstainer-details">
                  <summary>Belum memilih / golput ({organization.abstainers.length})</summary>
                  {organization.abstainers.length > 0 ? (
                    <ul>
                      {organization.abstainers.map((name, index) => (
                        <li key={`${name}-${index}`}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Semua pemilih terdaftar sudah memilih.</p>
                  )}
                </details>
                {organization.totalVotes > 0 && leader.votes > 0 && (
                  <p className="results-leader">
                    Suara terbanyak sementara: <strong>{leader.name} &amp; {leader.viceName}</strong>
                  </p>
                )}
              </article>
            );
          })}
        </section>
        {!results && !loading && !error && (
          <p className="results-empty">Rekap suara belum tersedia.</p>
        )}
        <footer className="app-footer admin-footer">
          <span>© 2026 SUARA MANDARA</span>
          <span>Rekap ini diperbarui saat tombol perbarui ditekan.</span>
        </footer>
      </div>
      {resetTarget && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !resetting) setResetTarget(null);
        }}>
          <section
            className="confirmation-modal reset-vote-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-vote-title"
          >
            <span className="reset-vote-icon" aria-hidden="true">↺</span>
            <span className="eyebrow dark-eyebrow">KONFIRMASI RESET SUARA</span>
            <h2 id="reset-vote-title">Reset pilihan siswa?</h2>
            <p>
              Suara <strong>{resetTarget.name}</strong> untuk {resetTarget.organizationName} akan
              dihapus dari rekap. Siswa dapat masuk kembali dan memilih ulang. NIS: {resetTarget.nis}.
            </p>
            {resetError && <p className="form-error reset-dialog-error" role="alert">{resetError}</p>}
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setResetTarget(null)}
                disabled={resetting}
              >
                Batal
              </button>
              <button
                className="primary-button reset-confirm-button"
                onClick={() => void resetVote()}
                disabled={resetting}
              >
                {resetting ? "Mereset..." : "Ya, reset suara"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
