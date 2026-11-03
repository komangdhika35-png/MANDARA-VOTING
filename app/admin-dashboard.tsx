"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type {
  CandidateConfigurations,
  ElectionCandidates,
  MpkMember,
  OrganizationId,
} from "@/lib/election";

type CandidateResult = { id: string; name: string; viceName?: string; number?: string; votes: number };
type PositionResult = {
  id: "chair" | "vice";
  title: string;
  totalVotes: number;
  candidates: { id: string; name: string; votes: number }[];
};

type OrganizationResult = {
  id: string;
  name: string;
  fullName: string;
  totalVotes: number;
  hasAnyVotes: boolean;
  candidates: CandidateResult[];
  positions: PositionResult[];
  voters: { nis: string; name: string; candidateName: string }[];
  abstainers: string[];
};

type Results = {
  organizations: OrganizationResult[];
  totalVotes: number;
};

function readCandidatePhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Promise.reject(new Error("Foto calon harus berformat JPG, PNG, atau WebP."));
  }
  if (file.size > 512 * 1024) {
    return Promise.reject(new Error("Ukuran foto calon maksimal 512 KB."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("File foto tidak dapat dibaca."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("File foto tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
}

export default function AdminDashboard({ onLogout }: { onLogout: () => Promise<void> }) {
  const [activeAdminPage, setActiveAdminPage] = useState<"results" | "candidates">("results");
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
  const [candidateConfigurations, setCandidateConfigurations] =
    useState<CandidateConfigurations | null>(null);
  const [mpkMembers, setMpkMembers] = useState<
    Record<"chair" | "vice", MpkMember[]> | null
  >(null);
  const [candidateError, setCandidateError] = useState("");
  const [candidateMessage, setCandidateMessage] = useState("");
  const [savingCandidates, setSavingCandidates] = useState(false);

  const loadCandidates = useCallback(async () => {
    setCandidateError("");
    try {
      const response = await fetch("/api/election/candidates", { cache: "no-store" });
      const data = (await response.json()) as Partial<ElectionCandidates> & { error?: string };
      if (!response.ok || !data.organizations || !data.mpkMembers) {
        throw new Error(data.error ?? "Gagal memuat pasangan calon.");
      }
      setCandidateConfigurations(data.organizations);
      setMpkMembers(data.mpkMembers);
    } catch (loadError) {
      setCandidateError(
        loadError instanceof Error ? loadError.message : "Tidak dapat memuat pasangan calon.",
      );
    }
  }, []);

  function updateCandidate(
    organizationId: OrganizationId,
    candidateId: string,
    field: "name" | "viceName" | "number" | "photoDataUrl" | "vision" | "mission",
    value: string,
  ) {
    setCandidateConfigurations((current) => {
      if (!current) return current;
      return {
        ...current,
        [organizationId]: current[organizationId].map((candidate) =>
          candidate.id === candidateId ? { ...candidate, [field]: value } : candidate,
        ),
      };
    });
    setCandidateMessage("");
  }

  function updateMpkMember(
    memberId: string,
    field: "name" | "photoDataUrl" | "vision" | "mission",
    value: string,
  ) {
    setMpkMembers((current) =>
      current
        ? {
            chair: current.chair.map((member) =>
              member.id === memberId ? { ...member, [field]: value } : member,
            ),
            vice: current.vice.map((member) =>
              member.id === memberId ? { ...member, [field]: value } : member,
            ),
          }
        : null,
    );
    setCandidateMessage("");
  }

  async function handleMpkPhotoChange(memberId: string, file: File) {
    setCandidateError("");
    try {
      const photoDataUrl = await readCandidatePhoto(file);
      updateMpkMember(memberId, "photoDataUrl", photoDataUrl);
    } catch (photoError) {
      setCandidateError(
        photoError instanceof Error ? photoError.message : "Tidak dapat membaca foto calon.",
      );
    }
  }

  async function handleCandidatePhotoChange(
    organizationId: OrganizationId,
    candidateId: string,
    file: File,
  ) {
    setCandidateError("");
    try {
      const photoDataUrl = await readCandidatePhoto(file);
      updateCandidate(organizationId, candidateId, "photoDataUrl", photoDataUrl);
    } catch (photoError) {
      setCandidateError(
        photoError instanceof Error ? photoError.message : "Tidak dapat membaca foto calon.",
      );
    }
  }

  async function saveCandidates() {
    if (!candidateConfigurations || !mpkMembers) return;
    setSavingCandidates(true);
    setCandidateError("");
    setCandidateMessage("");
    try {
      const response = await fetch("/api/admin/candidates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizations: {
            ...candidateConfigurations,
            osis: candidateConfigurations.osis.slice(0, 2),
            ky: candidateConfigurations.ky.slice(0, 2),
          },
          mpkMembers,
        }),
      });
      const data = (await response.json()) as {
        organizations?: CandidateConfigurations;
        mpkMembers?: Record<"chair" | "vice", MpkMember[]>;
        error?: string;
      };
      if (!response.ok || !data.organizations || !data.mpkMembers) {
        throw new Error(data.error ?? "Perubahan pasangan calon belum dapat disimpan.");
      }
      setCandidateConfigurations(data.organizations);
      setMpkMembers(data.mpkMembers);
      setCandidateMessage("Perubahan kandidat berhasil disimpan.");
      await loadResults();
    } catch (saveError) {
      setCandidateError(
        saveError instanceof Error
          ? saveError.message
          : "Tidak dapat menyimpan pasangan calon. Silakan coba lagi.",
      );
    } finally {
      setSavingCandidates(false);
    }
  }

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
      if (active) {
        void loadResults();
        void loadCandidates();
      }
    });
    return () => {
      active = false;
    };
  }, [loadCandidates, loadResults]);

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
            <h1>{activeAdminPage === "results" ? "Rekap suara" : "Pengaturan kandidat"}</h1>
            <p>
              {activeAdminPage === "results"
                ? "Ringkasan pilihan untuk setiap organisasi."
                : "Kelola daftar kandidat untuk setiap organisasi."}
            </p>
          </div>
          {activeAdminPage === "results" && (
            <button className="secondary-button refresh-button" onClick={() => void loadResults()} disabled={loading}>
              <span aria-hidden="true">↻</span> {loading ? "Memuat..." : "Perbarui rekap"}
            </button>
          )}
        </section>

        <nav className="admin-page-nav" aria-label="Halaman admin">
          <button
            id="admin-results-tab"
            className={activeAdminPage === "results" ? "active" : ""}
            type="button"
            aria-pressed={activeAdminPage === "results"}
            onClick={() => setActiveAdminPage("results")}
          >
            Rekap suara
          </button>
          <button
            id="admin-candidates-tab"
            className={activeAdminPage === "candidates" ? "active" : ""}
            type="button"
            aria-pressed={activeAdminPage === "candidates"}
            onClick={() => setActiveAdminPage("candidates")}
          >
            Pengaturan kandidat
          </button>
        </nav>

        {logoutError && <p className="form-error app-error" role="alert">{logoutError}</p>}

        <section
          id="admin-candidates-panel"
          className="admin-page-panel"
          aria-labelledby="admin-candidates-tab"
          hidden={activeAdminPage !== "candidates"}
        >
        {candidateError && <p className="form-error app-error" role="alert">{candidateError}</p>}
        {candidateMessage && <p className="admin-reset-notice" role="status">{candidateMessage}</p>}
        <section className="candidate-management" aria-labelledby="candidate-management-title">
          <div className="candidate-management-heading">
            <div>
              <span className="eyebrow dark-eyebrow">PENGATURAN PEMILIHAN</span>
              <h2 id="candidate-management-title">Atur kandidat</h2>
              <p>Kelola nama, foto, visi, dan misi calon MPK, OSIS, dan KY.</p>
            </div>
            <button
              className="primary-button candidate-save-button"
              onClick={() => void saveCandidates()}
              disabled={!candidateConfigurations || !mpkMembers || savingCandidates}
            >
              {savingCandidates ? "Menyimpan..." : "Simpan perubahan"}
            </button>
          </div>
          <div className="candidate-management-grid">
            {mpkMembers && (
              <article className="candidate-management-card" key="mpk">
                <h3>MPK · Daftar Calon per Jabatan</h3>
                {(results?.organizations.find((organization) => organization.id === "mpk")
                  ?.hasAnyVotes ?? false) && (
                  <p className="candidate-locked-note">
                    Nama dan daftar calon dikunci setelah suara tercatat. Foto, visi, dan misi tetap dapat diperbarui.
                  </p>
                )}
                {(["chair", "vice"] as const).map((position) => {
                  const positionTitle =
                    position === "chair" ? "Calon Ketua MPK · Kelas 11" : "Calon Wakil MPK · Kelas 10";
                  return (
                    <section className="mpk-admin-category" key={position}>
                      <h4>{positionTitle}</h4>
                      {mpkMembers[position].map((member) => (
                        <article className="mpk-member-editor" key={`${position}-${member.id}`}>
                          <div className="mpk-member-edit-row">
                            <label className="sr-only" htmlFor={`${position}-${member.id}-name`}>
                              Nama {positionTitle}
                            </label>
                            <input
                              id={`${position}-${member.id}-name`}
                              maxLength={80}
                              value={member.name}
                              disabled={
                                savingCandidates ||
                                (results?.organizations.find((organization) => organization.id === "mpk")
                                  ?.hasAnyVotes ?? false)
                              }
                              onChange={(event) =>
                                updateMpkMember(member.id, "name", event.target.value)
                              }
                            />
                            <button
                              type="button"
                              className="remove-member-button"
                              aria-label={`Hapus ${member.name} dari ${positionTitle}`}
                              disabled={
                                savingCandidates ||
                                (results?.organizations.find(
                                  (organization) => organization.id === "mpk",
                                )?.hasAnyVotes ?? false) ||
                                mpkMembers[position].length <= 1
                              }
                              onClick={() =>
                                setMpkMembers((current) =>
                                  current
                                    ? {
                                        ...current,
                                        [position]: current[position].filter(
                                          (item) => item.id !== member.id,
                                        ),
                                      }
                                    : null,
                                )
                              }
                            >
                              ×
                            </button>
                          </div>
                          <div className="mpk-member-profile">
                            <div className="mpk-member-photo-field">
                              <label htmlFor={`${position}-${member.id}-photo`}>
                                Foto calon <small>JPG, PNG, WebP · maks. 512 KB</small>
                              </label>
                              <input
                                id={`${position}-${member.id}-photo`}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                disabled={savingCandidates}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  event.target.value = "";
                                  if (file) void handleMpkPhotoChange(member.id, file);
                                }}
                              />
                              {member.photoDataUrl && (
                                <div className="mpk-member-photo-preview">
                                  <Image
                                    src={member.photoDataUrl}
                                    alt={`Foto ${member.name}`}
                                    width={96}
                                    height={96}
                                    unoptimized
                                  />
                                  <button
                                    type="button"
                                    className="remove-photo-button"
                                    disabled={savingCandidates}
                                    onClick={() => updateMpkMember(member.id, "photoDataUrl", "")}
                                  >
                                    Hapus foto
                                  </button>
                                </div>
                              )}
                            </div>
                            <label className="mpk-member-text-field" htmlFor={`${position}-${member.id}-vision`}>
                              Visi
                              <textarea
                                id={`${position}-${member.id}-vision`}
                                maxLength={500}
                                rows={3}
                                value={member.vision}
                                disabled={savingCandidates}
                                placeholder="Tuliskan visi calon"
                                onChange={(event) =>
                                  updateMpkMember(member.id, "vision", event.target.value)
                                }
                              />
                            </label>
                            <label className="mpk-member-text-field" htmlFor={`${position}-${member.id}-mission`}>
                              Misi
                              <textarea
                                id={`${position}-${member.id}-mission`}
                                maxLength={1200}
                                rows={4}
                                value={member.mission}
                                disabled={savingCandidates}
                                placeholder="Tuliskan misi calon"
                                onChange={(event) =>
                                  updateMpkMember(member.id, "mission", event.target.value)
                                }
                              />
                            </label>
                          </div>
                        </article>
                      ))}
                      <button
                        type="button"
                        className="add-member-button"
                        disabled={
                          savingCandidates ||
                          (results?.organizations.find((organization) => organization.id === "mpk")
                            ?.hasAnyVotes ?? false) ||
                          (position === "chair" && mpkMembers.chair.length >= 10) ||
                          mpkMembers.chair.length + mpkMembers.vice.length >= 200
                        }
                        onClick={() => {
                          setMpkMembers((current) =>
                            current
                              ? {
                                  ...current,
                                  [position]: [
                                    ...current[position],
                                      {
                                        id: `mpk-member-${crypto.randomUUID()}`,
                                        name: "",
                                        photoDataUrl: "",
                                        vision: "",
                                        mission: "",
                                      },
                                    ],
                                }
                              : null,
                          );
                          setCandidateMessage("");
                        }}
                      >
                        + Tambah calon {position === "chair" ? "ketua" : "wakil"}
                      </button>
                    </section>
                  );
                })}
              </article>
            )}
            {candidateConfigurations &&
              (["osis", "ky"] as const).map((organizationId) => {
                const hasVotes = (results?.organizations.find(
                  (organization) => organization.id === organizationId,
                )?.totalVotes ?? 0) > 0;
                return (
                  <article className="candidate-management-card" key={organizationId}>
                    <h3>{organizationId.toUpperCase()}</h3>
                    {hasVotes && (
                      <p className="candidate-locked-note">
                        Nama dan nomor dikunci setelah suara tercatat. Foto, visi, dan misi tetap dapat diperbarui.
                      </p>
                    )}
                    {candidateConfigurations[organizationId].slice(0, 2).map((candidate, index) => (
                      <fieldset
                        className="candidate-edit-fields"
                        key={candidate.id}
                      >
                        <legend>Paslon {index + 1}</legend>
                        <label htmlFor={`${candidate.id}-name`}>Nama calon ketua</label>
                        <input
                          id={`${candidate.id}-name`}
                          maxLength={80}
                          value={candidate.name}
                          disabled={savingCandidates || hasVotes}
                          onChange={(event) =>
                            updateCandidate(
                              organizationId,
                              candidate.id,
                              "name",
                              event.target.value,
                            )
                          }
                        />
                        <label htmlFor={`${candidate.id}-vice`}>Nama calon wakil ketua</label>
                        <input
                          id={`${candidate.id}-vice`}
                          maxLength={80}
                          value={candidate.viceName}
                          disabled={savingCandidates || hasVotes}
                          onChange={(event) =>
                            updateCandidate(
                              organizationId,
                              candidate.id,
                              "viceName",
                              event.target.value,
                            )
                          }
                        />
                        <label htmlFor={`${candidate.id}-number`}>Nomor paslon (01-99)</label>
                        <input
                          id={`${candidate.id}-number`}
                          inputMode="numeric"
                          maxLength={2}
                          value={candidate.number}
                          disabled={savingCandidates || hasVotes}
                          onChange={(event) =>
                            updateCandidate(
                              organizationId,
                              candidate.id,
                              "number",
                              event.target.value,
                            )
                          }
                        />
                        <label htmlFor={`${candidate.id}-photo`}>
                          Foto pasangan <small>JPG, PNG, WebP · maks. 512 KB</small>
                        </label>
                        <input
                          id={`${candidate.id}-photo`}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={savingCandidates}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file) {
                              void handleCandidatePhotoChange(organizationId, candidate.id, file);
                            }
                          }}
                        />
                        {candidate.photoDataUrl && (
                          <div className="mpk-member-photo-preview">
                            <Image
                              src={candidate.photoDataUrl}
                              alt={`Foto pasangan ${candidate.name} dan ${candidate.viceName}`}
                              width={96}
                              height={96}
                              unoptimized
                            />
                            <button
                              type="button"
                              className="remove-photo-button"
                              disabled={savingCandidates}
                              onClick={() =>
                                updateCandidate(organizationId, candidate.id, "photoDataUrl", "")
                              }
                            >
                              Hapus foto
                            </button>
                          </div>
                        )}
                        <label htmlFor={`${candidate.id}-vision`}>Visi</label>
                        <textarea
                          id={`${candidate.id}-vision`}
                          maxLength={500}
                          rows={3}
                          value={candidate.vision}
                          disabled={savingCandidates}
                          placeholder="Tuliskan visi pasangan"
                          onChange={(event) =>
                            updateCandidate(
                              organizationId,
                              candidate.id,
                              "vision",
                              event.target.value,
                            )
                          }
                        />
                        <label htmlFor={`${candidate.id}-mission`}>Misi</label>
                        <textarea
                          id={`${candidate.id}-mission`}
                          maxLength={1200}
                          rows={4}
                          value={candidate.mission}
                          disabled={savingCandidates}
                          placeholder="Tuliskan misi pasangan"
                          onChange={(event) =>
                            updateCandidate(
                              organizationId,
                              candidate.id,
                              "mission",
                              event.target.value,
                            )
                          }
                        />
                      </fieldset>
                    ))}
                  </article>
                );
              })}
          </div>
        </section>
        </section>

        <section
          id="admin-results-panel"
          className="admin-page-panel"
          aria-labelledby="admin-results-tab"
          hidden={activeAdminPage !== "results"}
        >
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
            const leader = organization.candidates.length > 0
            ? organization.candidates.reduce(
                (current, candidate) => candidate.votes > current.votes ? candidate : current,
                organization.candidates[0],
              )
            : null;
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
                  <span className="results-total">
                    <strong>{organization.totalVotes}</strong>
                    <small>{organization.id === "mpk" ? "pemilih lengkap" : "suara"}</small>
                  </span>
                </header>
                {organization.positions.length > 0 ? (
                  <div className="mpk-results-positions">
                    {organization.positions.map((position) => (
                      <section className="mpk-results-position" key={position.id}>
                        <h3>{position.title} <small>{position.totalVotes} suara</small></h3>
                        <div className="results-candidates">
                          {position.candidates.map((candidate) => {
                            const percentage = position.totalVotes
                              ? Math.round((candidate.votes / position.totalVotes) * 100)
                              : 0;
                            return (
                              <div className="result-candidate" key={candidate.id}>
                                <div className="result-candidate-copy">
                                  <span className="result-team-names"><strong>{candidate.name}</strong></span>
                                  <strong>{candidate.votes} <small>({percentage}%)</small></strong>
                                </div>
                                <div className="result-track" role="progressbar"
                                  aria-label={`Suara ${position.title} untuk ${candidate.name}`}
                                  aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
                                  <span style={{ width: `${percentage}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                <div className="results-candidates">
                  {organization.candidates.map((candidate) => {
                    const percentage = organization.totalVotes
                      ? Math.round((candidate.votes / organization.totalVotes) * 100)
                      : 0;
                    return (
                      <div className="result-candidate" key={candidate.id}>
                        <div className="result-candidate-copy">
                          <span>
                            <small className="result-number">{candidate.number}</small>
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
                )}
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
                  <summary>
                    {organization.id === "mpk"
                      ? "Belum menyelesaikan pilihan"
                      : "Belum memilih / golput"} ({organization.abstainers.length})
                  </summary>
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
                {leader && organization.totalVotes > 0 && leader.votes > 0 && (
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
        </section>
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
