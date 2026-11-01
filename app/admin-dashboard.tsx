"use client";

import { useCallback, useEffect, useState } from "react";

type OrganizationResult = {
  id: string;
  name: string;
  fullName: string;
  totalVotes: number;
  candidates: { id: string; name: string; votes: number }[];
  voters: { name: string; candidateName: string }[];
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
                          <span><small className="result-number">0{index + 1}</small>{candidate.name}</span>
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
                      {organization.voters.map((voter, index) => (
                        <li key={`${voter.name}-${index}`}>
                          <span>{voter.name}</span>
                          <strong>{voter.candidateName}</strong>
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
                  <p className="results-leader">Suara terbanyak sementara: <strong>{leader.name}</strong></p>
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
    </main>
  );
}
