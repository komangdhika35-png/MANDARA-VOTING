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
    <main className="min-h-screen">
      <header className="flex h-[70px] items-center justify-between border-b border-[#e9ebe4] bg-[rgba(255,255,255,.82)] px-8 motion-safe:animate-fade-in min-[1124px]:px-[calc((100vw-1060px)/2)] max-[760px]:h-[62px] max-[760px]:px-5">
        <a className="brand [display:inline-flex] [align-items:center] [gap:10px]" href="#" aria-label="Suara Mandara">
          <span className="brand-mark [width:30px] [height:30px] [border-radius:10px_10px_10px_3px] [display:grid] [place-items:center] [background:#c93246] [transform:rotate(-8deg)] [&_>_span]:[width:12px] [&_>_span]:[height:12px] [&_>_span]:[border:2px_solid_var(--lime)] [&_>_span]:[border-radius:50%] [&_>_span]:[position:relative] [&_>_span::after]:[content:''] [&_>_span::after]:[width:4px] [&_>_span::after]:[height:4px] [&_>_span::after]:[border-radius:50%] [&_>_span::after]:[position:absolute] [&_>_span::after]:[background:#fff] [&_>_span::after]:[left:2px] [&_>_span::after]:[top:2px] [&_>_span]:[border-color:#fff]"><span /></span>
          <span className="brand-copy [font:800_20px_'Manrope',_sans-serif] [letter-spacing:-1.2px] [&_>_span]:[color:#c93246]">suara<span>mandara</span></span>
        </a>
        <button className="profile-button [display:flex] [align-items:center] [gap:9px] [padding:0] [border:0] [background:transparent] [text-align:left] [cursor:pointer]" onClick={() => void handleLogout()} title="Keluar">
          <span className="profile-avatar [width:32px] [height:32px] [border-radius:50%] [display:grid] [place-items:center] [color:#315940] [background:#e6edda] [font-size:10px] [font-weight:700]">AD</span>
          <span className="profile-name [color:#34473d] [font-size:10px] [font-weight:700] [&_small]:[display:block] [&_small]:[margin-top:2px] [&_small]:[color:#9aa29b] [&_small]:[font-size:8px] [&_small]:[font-weight:400]">Admin<small>Pengelola hasil</small></span>
          <span className="logout-icon [margin-left:7px] [color:#89958b] [font-size:16px] [transform:rotate(90deg)]" aria-hidden="true">↗</span>
        </button>
      </header>

      <div className="mx-auto w-[min(1060px,calc(100%_-_64px))] pb-[30px] max-[760px]:w-[calc(100%_-_36px)]">
        <section className="admin-welcome motion-safe:animate-rise-in [display:flex] [align-items:center] [justify-content:space-between] [gap:18px] [padding:35px_0_23px] [&_h1]:[margin:8px_0_4px] [&_h1]:[color:#27392f] [&_h1]:[font:800_29px_'Nunito',_'DM_Sans',_sans-serif] [&_h1]:[letter-spacing:-.8px] [&_p]:[margin:0] [&_p]:[color:#838d84] [&_p]:[font-size:11px] max-[760px]:[padding:25px_0_18px] max-[420px]:[&_h1]:[font-size:25px]">
          <div>
            <span className="eyebrow dark-eyebrow [font-size:9px] [font-weight:700] [letter-spacing:1.15px] [color:#849177]"><span className="live-dot [width:7px] [height:7px] [display:inline-block] [flex:0_0_auto] [border-radius:50%] [background:#cbe67c] [box-shadow:0_0_0_3px_rgba(203,_230,_124,_.13)]" /> HALAMAN ADMIN</span>
            <h1>{activeAdminPage === "results" ? "Rekap suara" : "Pengaturan kandidat"}</h1>
            <p>
              {activeAdminPage === "results"
                ? "Ringkasan pilihan untuk setiap organisasi."
                : "Kelola daftar kandidat untuk setiap organisasi."}
            </p>
          </div>
          {activeAdminPage === "results" && (
            <button className="secondary-button refresh-button transition-transform duration-200 hover:-translate-y-0.5 active:scale-[.98] motion-reduce:transform-none [&:focus-visible]:[outline:3px_solid_#b5cd79] [&:focus-visible]:[outline-offset:3px] [height:42px] [border:1px_solid_#e4e8df] [border-radius:7px] [color:#536454] [background:#fff] [font-size:10px] [font-weight:600] [cursor:pointer] [display:inline-flex] [align-items:center] [gap:8px] [padding:0_14px] [&:disabled]:[opacity:.65] [&:disabled]:[cursor:wait] [&_span]:[font-size:16px]" onClick={() => void loadResults()} disabled={loading}>
              <span className={loading ? "motion-safe:animate-spin" : ""} aria-hidden="true">↻</span> {loading ? "Memuat..." : "Perbarui rekap"}
            </button>
          )}
        </section>

        <nav className="admin-page-nav [display:flex] [gap:5px] [margin-bottom:17px] [border-bottom:1px_solid_#e9ebe4] [&_button]:[min-height:40px] [&_button]:[padding:0_15px] [&_button]:[border:0] [&_button]:[border-bottom:2px_solid_transparent] [&_button]:[color:#78837a] [&_button]:[background:transparent] [&_button]:[font:inherit] [&_button]:[font-size:10px] [&_button]:[font-weight:700] [&_button]:[cursor:pointer] [&_button:hover]:[color:#a93646] [&_button.active]:[border-bottom-color:#b83243] [&_button.active]:[color:#a93646] [&_button:focus-visible]:[outline:2px_solid_#d99099] [&_button:focus-visible]:[outline-offset:-2px]" aria-label="Halaman admin">
          <button
            id="admin-results-tab"
            className={`transition-colors duration-200 motion-reduce:transition-none ${activeAdminPage === "results" ? "active" : ""}`}
            type="button"
            aria-pressed={activeAdminPage === "results"}
            onClick={() => setActiveAdminPage("results")}
          >
            Rekap suara
          </button>
          <button
            id="admin-candidates-tab"
            className={`transition-colors duration-200 motion-reduce:transition-none ${activeAdminPage === "candidates" ? "active" : ""}`}
            type="button"
            aria-pressed={activeAdminPage === "candidates"}
            onClick={() => setActiveAdminPage("candidates")}
          >
            Pengaturan kandidat
          </button>
        </nav>

        {logoutError && <p className="form-error app-error [margin:-7px_0_10px] [color:#b6473d] [font-size:10px] [width:fit-content] [margin:14px_0_0] [padding:9px_12px] [border:1px_solid_#f0d7d9] [border-radius:6px] [background:#fff7f7]" role="alert">{logoutError}</p>}

        <section
          id="admin-candidates-panel"
          key={`candidates-${activeAdminPage}`}
          className="admin-page-panel motion-safe:animate-content-in [&[hidden]]:[display:none]"
          aria-labelledby="admin-candidates-tab"
          hidden={activeAdminPage !== "candidates"}
        >
        {candidateError && <p className="form-error app-error [margin:-7px_0_10px] [color:#b6473d] [font-size:10px] [width:fit-content] [margin:14px_0_0] [padding:9px_12px] [border:1px_solid_#f0d7d9] [border-radius:6px] [background:#fff7f7]" role="alert">{candidateError}</p>}
        {candidateMessage && <p className="admin-reset-notice motion-safe:animate-content-in [margin:12px_0] [padding:10px_12px] [border:1px_solid_#dce9ce] [border-radius:7px] [color:#4a693c] [background:#f5faef] [font-size:10px] [line-height:1.6]" role="status">{candidateMessage}</p>}
        <section className="candidate-management [margin-top:20px] [padding:20px] [border:1px_solid_#e9ebe4] [border-radius:11px] [background:#fff]" aria-labelledby="candidate-management-title">
          <div className="candidate-management-heading [display:flex] [align-items:center] [justify-content:space-between] [gap:16px] [&_h2]:[margin:7px_0_4px] [&_h2]:[color:#27392f] [&_h2]:[font:800_20px_'Nunito',_'DM_Sans',_sans-serif] [&_p]:[margin:0] [&_p]:[color:#838d84] [&_p]:[font-size:10px] max-[760px]:[align-items:flex-start] max-[760px]:[flex-direction:column]">
            <div>
              <span className="eyebrow dark-eyebrow [font-size:9px] [font-weight:700] [letter-spacing:1.15px] [color:#849177]">PENGATURAN PEMILIHAN</span>
              <h2 id="candidate-management-title">Atur kandidat</h2>
              <p>Kelola nama, foto, visi, dan misi calon MPK, OSIS, dan KY.</p>
            </div>
            <button
              className="primary-button candidate-save-button transition-[transform,background-color] duration-200 hover:-translate-y-0.5 motion-reduce:transform-none [height:44px] [border:0] [border-radius:7px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:14px] [color:#f9faef] [background:#17483b] [font-size:10px] [font-weight:700] [cursor:pointer] [transition:background_.2s,_transform_.2s,_box-shadow_.2s,_opacity_.2s] [&:hover:not(:disabled)]:[background:#225d4b] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:active:not(:disabled)]:[transform:translateY(0)_scale(.98)] [&:disabled]:[cursor:wait] [&:focus-visible]:[outline:3px_solid_#b5cd79] [&:focus-visible]:[outline-offset:3px] [&_span]:[font-size:15px] [&_span]:[font-weight:400] [flex:0_0_auto] [padding:0_15px] [background:#b83243] [&:hover:not(:disabled)]:[background:#9e2939] [&:disabled]:[opacity:.65]"
              onClick={() => void saveCandidates()}
              disabled={!candidateConfigurations || !mpkMembers || savingCandidates}
            >
              {savingCandidates ? <><span className="mr-2 inline-block motion-safe:animate-spin" aria-hidden="true">↻</span>Menyimpan...</> : "Simpan perubahan"}
            </button>
          </div>
          <div className="candidate-management-grid [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:12px] [margin-top:17px] max-[760px]:[grid-template-columns:1fr]">
            {mpkMembers && (
              <article className="candidate-management-card motion-safe:animate-content-in [min-width:0] [padding:14px] [border:1px_solid_#f0e9e7] [border-radius:9px] [background:#fffdfd] [&_h3]:[margin:0_0_12px] [&_h3]:[color:#a93646] [&_h3]:[font-size:12px]" key="mpk">
                <h3>MPK · Daftar Calon per Jabatan</h3>
                {(results?.organizations.find((organization) => organization.id === "mpk")
                  ?.hasAnyVotes ?? false) && (
                  <p className="candidate-locked-note [margin:-4px_0_10px] [color:#795a2d] [font-size:9px] [line-height:1.5]">
                    Nama dan daftar calon dikunci setelah suara tercatat. Foto, visi, dan misi tetap dapat diperbarui.
                  </p>
                )}
                {(["chair", "vice"] as const).map((position) => {
                  const positionTitle =
                    position === "chair" ? "Calon Ketua MPK · Kelas 11" : "Calon Wakil MPK · Kelas 10";
                  return (
                    <section
                      className="mpk-admin-category motion-safe:animate-content-in"
                      key={position}
                      style={{ animationDelay: position === "chair" ? "70ms" : "140ms" }}
                    >
                      <h4>{positionTitle}</h4>
                      {mpkMembers[position].map((member, index) => (
                        <article
                          className="mpk-member-editor motion-safe:animate-poster-in transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 motion-reduce:animate-none motion-reduce:transform-none [margin:10px_0] [padding:10px] [border:1px_solid_#f0e9e7] [border-radius:8px] [background:#fff]"
                          key={`${position}-${member.id}`}
                          style={{ animationDelay: `${Math.min(index, 7) * 45}ms` }}
                        >
                          <div className="mpk-member-edit-row [display:flex] [gap:7px] [margin:8px_0] [&_input]:[min-width:0] [&_input]:[flex:1] [&_input]:[height:34px] [&_input]:[padding:0_9px] [&_input]:[border:1px_solid_#e5e6df] [&_input]:[border-radius:6px] [&_input]:[color:#34483e] [&_input]:[background:#fff] [&_input]:[font:inherit] [&_input]:[font-size:10px] [&_input:focus]:[border-color:#b83243] [&_input:focus]:[outline:2px_solid_rgba(184,_50,_67,_.12)] [&_input:disabled]:[opacity:.6]">
                            <label className="sr-only [position:absolute] [width:1px] [height:1px] [overflow:hidden] [clip:rect(0,_0,_0,_0)] [white-space:nowrap] [clip-path:inset(50%)]" htmlFor={`${position}-${member.id}-name`}>
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
                              className="remove-member-button [width:34px] [flex:0_0_auto] [border:1px_solid_#f0d7d9] [border-radius:6px] [color:#ae3443] [background:#fff7f7] [font-size:18px] [cursor:pointer] [&:disabled]:[opacity:.6] [&:disabled]:[cursor:not-allowed]"
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
                          <div className="mpk-member-profile [display:grid] [gap:10px] [&_label]:[display:grid] [&_label]:[gap:5px] [&_label]:[color:#647168] [&_label]:[font-size:8px] [&_label]:[font-weight:700] [&_label_small]:[margin-left:3px] [&_label_small]:[color:#929a91] [&_label_small]:[font-size:7px] [&_label_small]:[font-weight:500] [&_input[type='file']]:[width:100%] [&_input[type='file']]:[min-width:0] [&_input[type='file']]:[color:#78827d] [&_input[type='file']]:[font-size:8px] [&_input[type='file']::file-selector-button]:[margin-right:7px] [&_input[type='file']::file-selector-button]:[padding:6px_8px] [&_input[type='file']::file-selector-button]:[border:1px_solid_#eadbdd] [&_input[type='file']::file-selector-button]:[border-radius:5px] [&_input[type='file']::file-selector-button]:[color:#a93646] [&_input[type='file']::file-selector-button]:[background:#fff8f8] [&_input[type='file']::file-selector-button]:[font:inherit] [&_input[type='file']::file-selector-button]:[cursor:pointer] [&_textarea]:[width:100%] [&_textarea]:[min-width:0] [&_textarea]:[resize:vertical] [&_textarea]:[padding:8px] [&_textarea]:[border:1px_solid_#e5e6df] [&_textarea]:[border-radius:6px] [&_textarea]:[color:#34483e] [&_textarea]:[background:#fff] [&_textarea]:[font:inherit] [&_textarea]:[font-size:9px] [&_textarea]:[line-height:1.5] [&_textarea:focus]:[border-color:#b83243] [&_textarea:focus]:[outline:2px_solid_rgba(184,_50,_67,_.12)] [&_textarea:disabled]:[opacity:.6]">
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
                                <div className="mpk-member-photo-preview motion-safe:animate-content-in [display:flex] [align-items:flex-start] [gap:8px] [margin-top:8px] [&_img]:[width:64px] [&_img]:[height:64px] [&_img]:[object-fit:cover] [&_img]:[border:1px_solid_#eee6e3] [&_img]:[border-radius:6px]">
                                  <Image
                                    src={member.photoDataUrl}
                                    alt={`Foto ${member.name}`}
                                    width={96}
                                    height={96}
                                    unoptimized
                                  />
                                  <button
                                    type="button"
                                    className="remove-photo-button [min-height:28px] [padding:0_8px] [border:1px_solid_#f0d7d9] [border-radius:5px] [color:#a93646] [background:#fff7f7] [font-size:8px] [cursor:pointer] [&:disabled]:[opacity:.6] [&:disabled]:[cursor:wait]"
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
                        className="add-member-button [width:100%] [min-height:34px] [margin-top:7px] [border:1px_dashed_#d8b8ba] [border-radius:6px] [color:#a93646] [background:#fffafa] [font-size:9px] [font-weight:700] [cursor:pointer] [&:disabled]:[opacity:.6] [&:disabled]:[cursor:not-allowed]"
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
              (["osis", "ky"] as const).map((organizationId, organizationIndex) => {
                const hasVotes = (results?.organizations.find(
                  (organization) => organization.id === organizationId,
                )?.totalVotes ?? 0) > 0;
                return (
                  <article
                    className="candidate-management-card motion-safe:animate-content-in [min-width:0] [padding:14px] [border:1px_solid_#f0e9e7] [border-radius:9px] [background:#fffdfd] [&_h3]:[margin:0_0_12px] [&_h3]:[color:#a93646] [&_h3]:[font-size:12px]"
                    key={organizationId}
                    style={{ animationDelay: `${(organizationIndex + 1) * 90}ms` }}
                  >
                    <h3>{organizationId.toUpperCase()}</h3>
                    {hasVotes && (
                      <p className="candidate-locked-note [margin:-4px_0_10px] [color:#795a2d] [font-size:9px] [line-height:1.5]">
                        Nama dan nomor dikunci setelah suara tercatat. Foto, visi, dan misi tetap dapat diperbarui.
                      </p>
                    )}
                    {candidateConfigurations[organizationId].slice(0, 2).map((candidate, index) => (
                      <fieldset
                        className="candidate-edit-fields motion-safe:animate-poster-in [display:grid] [gap:7px] [margin:0] [padding:12px_0] [border:0] [border-top:1px_solid_#f1ece9] [&_legend]:[padding:0_6px_0_0] [&_legend]:[color:#647168] [&_legend]:[font-size:9px] [&_legend]:[font-weight:700] [&_label]:[color:#647168] [&_label]:[font-size:8px] [&_label]:[font-weight:700] [&_input]:[width:100%] [&_input]:[min-width:0] [&_input]:[height:34px] [&_input]:[padding:0_9px] [&_input]:[border:1px_solid_#e5e6df] [&_input]:[border-radius:6px] [&_input]:[color:#34483e] [&_input]:[background:#fff] [&_input]:[font:inherit] [&_input]:[font-size:10px] [&_input:focus]:[border-color:#b83243] [&_input:focus]:[outline:2px_solid_rgba(184,_50,_67,_.12)] [&_input:last-child]:[max-width:90px] [&_textarea]:[width:100%] [&_textarea]:[min-width:0] [&_textarea]:[resize:vertical] [&_textarea]:[padding:8px_9px] [&_textarea]:[border:1px_solid_#e5e6df] [&_textarea]:[border-radius:6px] [&_textarea]:[color:#34483e] [&_textarea]:[background:#fff] [&_textarea]:[font:inherit] [&_textarea]:[font-size:9px] [&_textarea]:[line-height:1.5] [&_textarea:focus]:[border-color:#b83243] [&_textarea:focus]:[outline:2px_solid_rgba(184,_50,_67,_.12)] [&_textarea:disabled]:[opacity:.6] [&_input[type='file']]:[height:auto] [&_input[type='file']]:[padding:6px] [&_input[type='file']]:[font-size:8px] [&_input[type='file']::file-selector-button]:[margin-right:7px] [&_input[type='file']::file-selector-button]:[padding:6px_8px] [&_input[type='file']::file-selector-button]:[border:1px_solid_#eadbdd] [&_input[type='file']::file-selector-button]:[border-radius:5px] [&_input[type='file']::file-selector-button]:[color:#a93646] [&_input[type='file']::file-selector-button]:[background:#fff8f8] [&_input[type='file']::file-selector-button]:[font:inherit] [&_input[type='file']::file-selector-button]:[cursor:pointer] [&_>_label_small]:[margin-left:3px] [&_>_label_small]:[color:#929a91] [&_>_label_small]:[font-size:7px] [&_>_label_small]:[font-weight:500]"
                        key={candidate.id}
                        style={{ animationDelay: `${(organizationIndex * 2 + index) * 75}ms` }}
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
                          <div className="mpk-member-photo-preview motion-safe:animate-content-in [display:flex] [align-items:flex-start] [gap:8px] [margin-top:8px] [&_img]:[width:64px] [&_img]:[height:64px] [&_img]:[object-fit:cover] [&_img]:[border:1px_solid_#eee6e3] [&_img]:[border-radius:6px]">
                            <Image
                              src={candidate.photoDataUrl}
                              alt={`Foto pasangan ${candidate.name} dan ${candidate.viceName}`}
                              width={96}
                              height={96}
                              unoptimized
                            />
                            <button
                              type="button"
                              className="remove-photo-button [min-height:28px] [padding:0_8px] [border:1px_solid_#f0d7d9] [border-radius:5px] [color:#a93646] [background:#fff7f7] [font-size:8px] [cursor:pointer] [&:disabled]:[opacity:.6] [&:disabled]:[cursor:wait]"
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
          key={`results-${activeAdminPage}`}
          className="admin-page-panel motion-safe:animate-content-in [&[hidden]]:[display:none]"
          aria-labelledby="admin-results-tab"
          hidden={activeAdminPage !== "results"}
        >
        {error && <p className="form-error app-error [margin:-7px_0_10px] [color:#b6473d] [font-size:10px] [width:fit-content] [margin:14px_0_0] [padding:9px_12px] [border:1px_solid_#f0d7d9] [border-radius:6px] [background:#fff7f7]" role="alert">{error}</p>}
        {resetError && <p className="form-error app-error [margin:-7px_0_10px] [color:#b6473d] [font-size:10px] [width:fit-content] [margin:14px_0_0] [padding:9px_12px] [border:1px_solid_#f0d7d9] [border-radius:6px] [background:#fff7f7]" role="alert">{resetError}</p>}
        {resetMessage && <p className="admin-reset-notice [margin:12px_0] [padding:10px_12px] [border:1px_solid_#dce9ce] [border-radius:7px] [color:#4a693c] [background:#f5faef] [font-size:10px] [line-height:1.6]" role="status">{resetMessage}</p>}

        <section className="admin-total-card [min-height:104px] [display:flex] [align-items:center] [gap:15px] [padding:19px_22px] [border:1px_solid_#f0e2e3] [border-radius:11px] [background:linear-gradient(110deg,_#fff_12%,_#fff7f7_100%)] [&_small]:[display:block] [&_strong]:[display:block] [&_small]:[color:#9a8587] [&_small]:[font-size:8px] [&_small]:[font-weight:700] [&_small]:[letter-spacing:.8px] [&_strong]:[margin-top:5px] [&_strong]:[color:#342b2c] [&_strong]:[font:800_25px_'Nunito',_sans-serif] max-[420px]:[gap:11px] max-[420px]:[padding:15px]" aria-live="polite">
          <span className="admin-total-icon [width:43px] [height:43px] [border-radius:12px] [display:grid] [place-items:center] [color:#bd3548] [background:#ffeaec] [font-size:20px]" aria-hidden="true">✓</span>
          <span><small>TOTAL SUARA TERCATAT</small><strong key={results?.totalVotes ?? "loading"} className="motion-safe:animate-number-in">{loading && !results ? "—" : results?.totalVotes ?? 0}</strong></span>
          <span className="admin-total-caption [margin-left:auto] [color:#9a8c8d] [font-size:9px] max-[760px]:[max-width:140px] max-[760px]:[text-align:right] max-[760px]:[line-height:1.5] max-[420px]:[max-width:115px] max-[420px]:[font-size:8px]">Data diambil langsung dari database SQLite</span>
        </section>
        <p className="admin-privacy-notice [margin:11px_0_0] [padding:10px_12px] [border:1px_solid_#f1e2c6] [border-radius:8px] [color:#795a2d] [background:#fffaf0] [font-size:9px] [line-height:1.55]" role="note">
          Privasi: halaman ini menampilkan nama siswa beserta pilihannya. Batasi akses halaman ini hanya untuk admin.
        </p>

        <section className="results-grid [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:15px] [margin-top:17px] max-[760px]:[grid-template-columns:1fr] max-[760px]:[gap:10px]" aria-label="Rekap suara tiap organisasi" aria-busy={loading}>
          {results?.organizations.map((organization, index) => {
            const leader = organization.candidates.length > 0
            ? organization.candidates.reduce(
                (current, candidate) => candidate.votes > current.votes ? candidate : current,
                organization.candidates[0],
              )
            : null;
            return (
              <article
                className="results-card transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg motion-safe:animate-fade-in motion-reduce:animate-none motion-reduce:transform-none [min-width:0] [padding:18px_17px_14px] [border:1px_solid_#e9ebe4] [border-radius:10px] [background:#fff] [box-shadow:0_4px_14px_rgba(32,_54,_43,_.025)]"
                key={organization.id}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <header className="results-card-header [display:flex] [align-items:center] [gap:10px] [padding-bottom:14px] [border-bottom:1px_solid_#f0f0eb]">
                  <span className={`organization-icon  [width:34px] [height:34px] [flex:0_0_auto] [border-radius:9px] [display:grid] [place-items:center] [font:700_13px_'Manrope',_sans-serif] max-[760px]:[width:28px] max-[760px]:[height:28px] max-[760px]:[border-radius:7px] max-[760px]:[font-size:11px] max-[420px]:[width:25px] max-[420px]:[height:25px]${organization.id === "mpk" ? "lilac [color:#63518c] [background:#e9e1f4]" : organization.id === "osis" ? "mint [color:#306953] [background:#dceee0]" : "peach [color:#a05e44] [background:#f8e3d6]"}`}>
                    {organization.name.charAt(0)}
                  </span>
                  <span className="results-organization-title [min-width:0] [flex:1] [&_strong]:[display:block] [&_small]:[display:block] [&_strong]:[color:#34483e] [&_strong]:[font-size:11px] [&_small]:[margin-top:3px] [&_small]:[overflow:hidden] [&_small]:[color:#929a91] [&_small]:[font-size:8px] [&_small]:[text-overflow:ellipsis] [&_small]:[white-space:nowrap]">
                    <strong>{organization.name}</strong>
                    <small>{organization.fullName}</small>
                  </span>
                  <span className="results-total [text-align:right] [&_strong]:[display:block] [&_strong]:[color:#374b3e] [&_strong]:[font:800_17px_'Nunito',_sans-serif] [&_small]:[display:block] [&_small]:[margin-top:1px] [&_small]:[color:#939b92] [&_small]:[font-size:8px]">
                    <strong>{organization.totalVotes}</strong>
                    <small>{organization.id === "mpk" ? "pemilih lengkap" : "suara"}</small>
                  </span>
                </header>
                {organization.positions.length > 0 ? (
                  <div className="mpk-results-positions [display:grid] [gap:14px]">
                    {organization.positions.map((position, positionIndex) => (
                      <section
                        className="mpk-results-position motion-safe:animate-content-in [padding-top:14px] [border-bottom:1px_solid_#f0f0eb] [padding-bottom:14px] [&_h3]:[display:flex] [&_h3]:[justify-content:space-between] [&_h3]:[gap:8px] [&_h3]:[margin:0] [&_h3]:[color:#536157] [&_h3]:[font-size:9px] [&_h3_small]:[color:#939b92] [&_h3_small]:[font-size:8px] [&_h3_small]:[font-weight:500] [&_.results-candidates]:[gap:11px] [&_.results-candidates]:[padding-top:11px]"
                        key={position.id}
                        style={{ animationDelay: `${positionIndex * 90}ms` }}
                      >
                        <h3>{position.title} <small>{position.totalVotes} suara</small></h3>
                        <div className="results-candidates [display:grid] [gap:15px] [padding-top:16px]">
                          {position.candidates.map((candidate) => {
                            const percentage = position.totalVotes
                              ? Math.round((candidate.votes / position.totalVotes) * 100)
                              : 0;
                            return (
                              <div className="result-candidate" key={candidate.id}>
                                <div className="result-candidate-copy [display:flex] [align-items:center] [justify-content:space-between] [gap:8px] [color:#536157] [font-size:9px] [&_>_span]:[display:flex] [&_>_span]:[min-width:0] [&_>_span]:[align-items:center] [&_>_span]:[gap:7px] [&_>_strong]:[flex:0_0_auto] [&_>_strong]:[color:#45574a] [&_>_strong]:[font-size:9px] [&_>_strong_small]:[color:#939b92] [&_>_strong_small]:[font-size:8px] [&_>_strong_small]:[font-weight:500]">
                                  <span className="result-team-names [&_strong]:[display:block] [&_small]:[display:block] [&_strong]:[color:#536157] [&_strong]:[font-size:9px] [&_strong]:[font-weight:600] [&_small]:[margin-top:2px] [&_small]:[color:#939b92] [&_small]:[font-size:8px] [&_small]:[font-weight:400]"><strong>{candidate.name}</strong></span>
                                  <strong>{candidate.votes} <small>({percentage}%)</small></strong>
                                </div>
                                <div className="result-track [height:6px] [margin-top:7px] [overflow:hidden] [border-radius:8px] [background:#f1f1ec] [&_>_span]:[display:block] [&_>_span]:[height:100%] [&_>_span]:[min-width:0] [&_>_span]:[border-radius:inherit] [&_>_span]:[background:linear-gradient(90deg,_#cf4253,_#e8999f)] [&_>_span]:[transition:width_.8s_cubic-bezier(.2,.8,.2,1)]" role="progressbar"
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
                <div className="results-candidates [display:grid] [gap:15px] [padding-top:16px]">
                  {organization.candidates.map((candidate) => {
                    const percentage = organization.totalVotes
                      ? Math.round((candidate.votes / organization.totalVotes) * 100)
                      : 0;
                    return (
                      <div className="result-candidate" key={candidate.id}>
                        <div className="result-candidate-copy [display:flex] [align-items:center] [justify-content:space-between] [gap:8px] [color:#536157] [font-size:9px] [&_>_span]:[display:flex] [&_>_span]:[min-width:0] [&_>_span]:[align-items:center] [&_>_span]:[gap:7px] [&_>_strong]:[flex:0_0_auto] [&_>_strong]:[color:#45574a] [&_>_strong]:[font-size:9px] [&_>_strong_small]:[color:#939b92] [&_>_strong_small]:[font-size:8px] [&_>_strong_small]:[font-weight:500]">
                          <span>
                            <small className="result-number [color:#a2aaa0] [font-size:8px]">{candidate.number}</small>
                            <span className="result-team-names [&_strong]:[display:block] [&_small]:[display:block] [&_strong]:[color:#536157] [&_strong]:[font-size:9px] [&_strong]:[font-weight:600] [&_small]:[margin-top:2px] [&_small]:[color:#939b92] [&_small]:[font-size:8px] [&_small]:[font-weight:400]">
                              <strong>{candidate.name}</strong>
                              <small>Wakil: {candidate.viceName}</small>
                            </span>
                          </span>
                          <strong>{candidate.votes} <small>({percentage}%)</small></strong>
                        </div>
                        <div
                          className="result-track [height:6px] [margin-top:7px] [overflow:hidden] [border-radius:8px] [background:#f1f1ec] [&_>_span]:[display:block] [&_>_span]:[height:100%] [&_>_span]:[min-width:0] [&_>_span]:[border-radius:inherit] [&_>_span]:[background:linear-gradient(90deg,_#cf4253,_#e8999f)] [&_>_span]:[transition:width_.8s_cubic-bezier(.2,.8,.2,1)]"
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
                <details className="voter-details [margin-top:13px] [border-top:1px_solid_#f1f0eb] [color:#566259] [font-size:9px] [&_summary]:[padding:11px_0_0] [&_summary]:[color:#566259] [&_summary]:[font-weight:700] [&_summary]:[cursor:pointer] [&[open]_>_ul]:[animation:details-in_350ms_cubic-bezier(.2,.75,.25,1)_both] [&[open]_>_p]:[animation:details-in_350ms_cubic-bezier(.2,.75,.25,1)_both] [&_ul]:[display:grid] [&_ul]:[gap:7px] [&_ul]:[max-height:210px] [&_ul]:[overflow-y:auto] [&_ul]:[margin:10px_0_0] [&_ul]:[padding:0_2px_0_14px] [&_li]:[padding-left:1px] [&_li]:[line-height:1.45] [&_li_span]:[display:block] [&_li_strong]:[display:block] [&_li_strong]:[color:#a93646] [&_li_strong]:[font-size:8px] [&_li_strong]:[font-weight:600] [&_p]:[margin:9px_0_0] [&_p]:[color:#929a91] [&_.admin-voter-row]:[display:flex] [&_.admin-voter-row]:[align-items:center] [&_.admin-voter-row]:[justify-content:space-between] [&_.admin-voter-row]:[gap:8px] [&_.admin-voter-row]:[padding:7px_0] [&_.admin-voter-row]:[border-bottom:1px_solid_#f4f1ed] [&_.admin-voter-row]:[list-style:none] [&_.admin-voter-copy_>_strong]:[color:#566259] [&_.admin-voter-copy_>_strong]:[font-size:9px] [&_.admin-voter-copy_>_span]:[margin-top:2px] [&_.admin-voter-copy_>_span]:[color:#a93646] [&_.admin-voter-copy_>_span]:[font-size:8px]">
                  <summary>Pemilih dan pilihannya ({organization.voters.length})</summary>
                  {organization.voters.length > 0 ? (
                    <ul>
                      {organization.voters.map((voter) => (
                        <li className="admin-voter-row motion-safe:animate-content-in" key={voter.nis}>
                          <span className="admin-voter-copy [min-width:0] [overflow-wrap:anywhere] [&_small]:[display:block] [&_small]:[margin-top:2px] [&_small]:[color:#929a91] [&_small]:[font-size:8px]">
                            <strong>{voter.name}</strong>
                            <small>NIS: {voter.nis}</small>
                            <span>{voter.candidateName}</span>
                          </span>
                          <button
                            className="reset-vote-button [flex:0_0_auto] [padding:5px_8px] [border:1px_solid_#f0d7d9] [border-radius:5px] [color:#ae3443] [background:#fff7f7] [font-size:8px] [font-weight:700] [cursor:pointer] [&:hover]:[border-color:#dfabb0] [&:hover]:[background:#ffeff0] [&:disabled]:[opacity:.6] [&:disabled]:[cursor:wait]"
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
                    <p className="motion-safe:animate-content-in">Belum ada siswa yang memilih.</p>
                  )}
                </details>
                <details className="voter-details abstainer-details [margin-top:13px] [border-top:1px_solid_#f1f0eb] [color:#566259] [font-size:9px] [&_summary]:[padding:11px_0_0] [&_summary]:[color:#566259] [&_summary]:[font-weight:700] [&_summary]:[cursor:pointer] [&[open]_>_ul]:[animation:details-in_350ms_cubic-bezier(.2,.75,.25,1)_both] [&[open]_>_p]:[animation:details-in_350ms_cubic-bezier(.2,.75,.25,1)_both] [&_ul]:[display:grid] [&_ul]:[gap:7px] [&_ul]:[max-height:210px] [&_ul]:[overflow-y:auto] [&_ul]:[margin:10px_0_0] [&_ul]:[padding:0_2px_0_14px] [&_li]:[padding-left:1px] [&_li]:[line-height:1.45] [&_li_span]:[display:block] [&_li_strong]:[display:block] [&_li_strong]:[color:#a93646] [&_li_strong]:[font-size:8px] [&_li_strong]:[font-weight:600] [&_p]:[margin:9px_0_0] [&_p]:[color:#929a91] [&_.admin-voter-row]:[display:flex] [&_.admin-voter-row]:[align-items:center] [&_.admin-voter-row]:[justify-content:space-between] [&_.admin-voter-row]:[gap:8px] [&_.admin-voter-row]:[padding:7px_0] [&_.admin-voter-row]:[border-bottom:1px_solid_#f4f1ed] [&_.admin-voter-row]:[list-style:none] [&_.admin-voter-copy_>_strong]:[color:#566259] [&_.admin-voter-copy_>_strong]:[font-size:9px] [&_.admin-voter-copy_>_span]:[margin-top:2px] [&_.admin-voter-copy_>_span]:[color:#a93646] [&_.admin-voter-copy_>_span]:[font-size:8px] [&_li]:[color:#795a2d]">
                  <summary>
                    {organization.id === "mpk"
                      ? "Belum menyelesaikan pilihan"
                      : "Belum memilih / golput"} ({organization.abstainers.length})
                  </summary>
                  {organization.abstainers.length > 0 ? (
                    <ul>
                      {organization.abstainers.map((name, index) => (
                        <li className="motion-safe:animate-content-in" key={`${name}-${index}`}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="motion-safe:animate-content-in">Semua pemilih terdaftar sudah memilih.</p>
                  )}
                </details>
                {leader && organization.totalVotes > 0 && leader.votes > 0 && (
                  <p className="results-leader [margin:16px_0_0] [padding-top:11px] [border-top:1px_solid_#f1f0eb] [color:#90978e] [font-size:8px] [&_strong]:[color:#665155] [&_strong]:[font-weight:700]">
                    Suara terbanyak sementara: <strong>{leader.name} &amp; {leader.viceName}</strong>
                  </p>
                )}
              </article>
            );
          })}
        </section>
        {!results && !loading && !error && (
          <p className="results-empty [padding:20px] [color:#889188] [font-size:11px] [text-align:center]">Rekap suara belum tersedia.</p>
        )}
        <footer className="app-footer admin-footer [display:flex] [justify-content:space-between] [padding:15px_2px_0] [color:#9ca39b] [font-size:8px] [letter-spacing:.35px] max-[760px]:[gap:12px] max-[760px]:[font-size:7px] max-[420px]:[font-size:6px] [margin-top:22px]">
          <span>© 2026 SUARA MANDARA</span>
          <span>Rekap ini diperbarui saat tombol perbarui ditekan.</span>
        </footer>
        </section>
      </div>
      {resetTarget && (
        <div className="modal-backdrop motion-safe:animate-backdrop-in [position:fixed] [z-index:10] [inset:0] [display:grid] [place-items:center] [padding:20px] [background:rgba(72,_30,_37,_.5)] [backdrop-filter:blur(3px)]" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !resetting) setResetTarget(null);
        }}>
          <section
            className="confirmation-modal reset-vote-modal motion-safe:animate-modal-in [width:min(420px,_100%)] [position:relative] [padding:31px] [border-radius:13px] [background:#fff] [box-shadow:0_20px_65px_rgba(81,_35,_40,_.2)] [text-align:center] [&_h2]:[margin:9px_0_9px] [&_h2]:[color:#432d31] [&_h2]:[font:700_20px_'Manrope',_sans-serif] [&_h2]:[letter-spacing:-.7px] [&_>_p]:[max-width:320px] [&_>_p]:[margin:0_auto] [&_>_p]:[color:#79847b] [&_>_p]:[font-size:10px] [&_>_p]:[line-height:1.7] [&_>_p_strong]:[color:#a93646] [border:1px_solid_#f1dfdf] [&_.modal-candidate-avatar]:[color:#a93646] [&_.modal-candidate-avatar]:[background:#fff0f1] [&_.modal-close]:[color:#9c6f74] [&_.modal-close]:[background:#fff4f4] [&_.modal-actions_.primary-button]:[background:linear-gradient(110deg,_#d84c5c,_#bd3548)] [&_.modal-actions_.primary-button:hover:not(:disabled)]:[background:#ad293b] [&_.modal-actions_.primary-button:focus-visible]:[outline-color:#e7a0a7] [&_.secondary-button]:[border-color:#f0dfe0] [&_.secondary-button]:[color:#80585d] [&_.secondary-button:hover]:[border-color:#d98b94] [&_.secondary-button:hover]:[background:#fff8f8] [&_>_p]:[max-width:350px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-vote-title"
          >
            <span className="reset-vote-icon [width:42px] [height:42px] [display:grid] [place-items:center] [margin:0_auto_13px] [border-radius:50%] [color:#a93646] [background:#fff0f1] [font-size:25px]" aria-hidden="true">↺</span>
            <span className="eyebrow dark-eyebrow [font-size:9px] [font-weight:700] [letter-spacing:1.15px] [color:#849177]">KONFIRMASI RESET SUARA</span>
            <h2 id="reset-vote-title">Reset pilihan siswa?</h2>
            <p>
              Suara <strong>{resetTarget.name}</strong> untuk {resetTarget.organizationName} akan
              dihapus dari rekap. Siswa dapat masuk kembali dan memilih ulang. NIS: {resetTarget.nis}.
            </p>
            {resetError && <p className="form-error reset-dialog-error [margin:-7px_0_10px] [color:#b6473d] [font-size:10px] [margin:12px_0_0]" role="alert">{resetError}</p>}
            <div className="modal-actions [display:grid] [grid-template-columns:1fr_1fr] [gap:9px] [margin-top:22px] [&_button:disabled]:[opacity:.65] [&_button:disabled]:[cursor:wait]">
              <button
                className="secondary-button [&:focus-visible]:[outline:3px_solid_#b5cd79] [&:focus-visible]:[outline-offset:3px] [height:42px] [border:1px_solid_#e4e8df] [border-radius:7px] [color:#536454] [background:#fff] [font-size:10px] [font-weight:600] [cursor:pointer]"
                onClick={() => setResetTarget(null)}
                disabled={resetting}
              >
                Batal
              </button>
              <button
                className="primary-button reset-confirm-button [height:44px] [border:0] [border-radius:7px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:14px] [color:#f9faef] [background:#17483b] [font-size:10px] [font-weight:700] [cursor:pointer] [transition:background_.2s,_transform_.2s,_box-shadow_.2s,_opacity_.2s] [&:hover:not(:disabled)]:[background:#225d4b] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:active:not(:disabled)]:[transform:translateY(0)_scale(.98)] [&:disabled]:[cursor:wait] [&:focus-visible]:[outline:3px_solid_#b5cd79] [&:focus-visible]:[outline-offset:3px] [&_span]:[font-size:15px] [&_span]:[font-weight:400] [background:#b83243] [&:hover:not(:disabled)]:[background:#9e2939] [&:disabled]:[opacity:.65]"
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
