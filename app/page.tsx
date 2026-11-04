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
type CandidateSelections = Partial<Record<"osis" | "ky", string>>;

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
  const [studentPasswordStep, setStudentPasswordStep] = useState(false);
  const [studentName, setStudentName] = useState("");
  const adminPasswordRef = useRef<HTMLInputElement>(null);
  const studentPasswordRef = useRef<HTMLInputElement>(null);
  const [voter, setVoter] = useState("");
  const [role, setRole] = useState<"student" | "admin" | null>(null);
  const [activeOrganization, setActiveOrganization] =
    useState<OrganizationId>("mpk");
  const [votes, setVotes] = useState<VoteRecord>({});
  const [mpkSelections, setMpkSelections] = useState<MpkSelections>({
    chair: null,
    vice: null,
  });
  const [candidateSelections, setCandidateSelections] = useState<CandidateSelections>({});
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
    if (studentPasswordStep) studentPasswordRef.current?.focus();
  }, [adminPasswordStep, studentPasswordStep]);

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
          candidateSelections?: CandidateSelections;
          error?: string;
        };
        if (!response.ok) throw new Error(data.error ?? "Gagal memuat sesi pemilih.");
        if (!active) return;

        setRole(data.role ?? "student");
        setVoter(data.voter?.name ?? "");
        setVotes(toVoteRecord(data.votedOrganizations ?? []));
        setMpkSelections(data.mpkSelections ?? { chair: null, vice: null });
        setCandidateSelections(data.candidateSelections ?? {});
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
          : organization.candidates.slice(0, 2).map((candidate) => {
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
    if (!adminLogin && !studentPasswordStep) {
      if (!/^\d{4}$/.test(cleanNis)) {
        setLoginError("NIS tidak valid.");
        return;
      }
      setLoginError("");
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nis: cleanNis, step: "identify" }),
        });
        const data = (await response.json()) as {
          voter?: { name: string };
          error?: string;
        };
        if (!response.ok) throw new Error(data.error ?? "NIS tidak terdaftar.");
        setStudentName(data.voter?.name ?? "");
        setStudentPasswordStep(true);
        setPassword("");
      } catch (error) {
        setLoginError(
          error instanceof Error ? error.message : "Tidak dapat memeriksa NIS. Silakan coba lagi.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    if (adminLogin && !password) {
      setLoginError("Password admin wajib diisi.");
      return;
    }
    if (!adminLogin && !password) {
      setLoginError("Password pemilih wajib diisi.");
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
            : { nis: cleanNis, password },
        ),
      });
      const data = (await response.json()) as {
        role?: "student" | "admin";
        voter?: { name: string };
        votedOrganizations?: OrganizationId[];
        mpkSelections?: MpkSelections;
        candidateSelections?: CandidateSelections;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Login tidak berhasil.");

      setRole(data.role ?? "student");
      setVoter(data.voter?.name ?? "");
      setVotes(toVoteRecord(data.votedOrganizations ?? []));
      setMpkSelections(data.mpkSelections ?? { chair: null, vice: null });
      setCandidateSelections(data.candidateSelections ?? {});
      setActiveOrganization("mpk");
      setSelectedMpkPosition("chair");
      setSelectedCandidate("");
      setNis("");
      setPassword("");
      setAdminPasswordStep(false);
      setStudentPasswordStep(false);
      setStudentName("");
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
    setCandidateSelections({});
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
        candidateSelections?: CandidateSelections;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Suara belum dapat disimpan.");

      setVotes(toVoteRecord(data.votedOrganizations ?? []));
      setMpkSelections(data.mpkSelections ?? { chair: null, vice: null });
      setCandidateSelections(data.candidateSelections ?? {});
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
  const isMpkCompletedScreen =
    role === "student" &&
    activeOrganization === "mpk" &&
    (Boolean(votes.mpk) || Boolean(mpkSelections.chair && mpkSelections.vice));
  const isPairCompletedScreen =
    role === "student" &&
    (activeOrganization === "osis" || activeOrganization === "ky") &&
    Boolean(votes[activeOrganization]);
  const isElectionCompletedScreen = isMpkCompletedScreen || isPairCompletedScreen;
  const activeOrganizationIndex = electionOrganizations.findIndex(
    (organization) => organization.id === activeOrganization,
  );
  const nextUnvotedOrganization = [
    ...electionOrganizations.slice(activeOrganizationIndex + 1),
    ...electionOrganizations.slice(0, activeOrganizationIndex),
  ].find((organization) => !votes[organization.id]);
  const isPairPoster =
    role === "student" &&
    (activeOrganization === "osis" || activeOrganization === "ky") &&
    !votes[activeOrganization];
  const pairPosterCandidates = currentOrganization.candidates.slice(0, 2);
  const selectedMpkChair = electionCandidates?.mpkMembers.chair.find(
    (candidate) => candidate.id === mpkSelections.chair,
  );
  const selectedMpkVice = electionCandidates?.mpkMembers.vice.find(
    (candidate) => candidate.id === mpkSelections.vice,
  );
  const selectedPairCandidate =
    activeOrganization === "osis" || activeOrganization === "ky"
      ? electionCandidates?.organizations[activeOrganization].find(
          (candidate) => candidate.id === candidateSelections[activeOrganization],
        )
      : undefined;

  if (!ready) return <main className="min-h-screen bg-paper" aria-label="Memuat aplikasi" />;

  if (!role) {
    const showAdminPasswordStep =
      nis.trim().toLocaleLowerCase("en-US") === "admin" && adminPasswordStep;
    const showStudentPasswordStep =
      nis.trim().toLocaleLowerCase("en-US") !== "admin" && studentPasswordStep;
    const showPasswordStep = showAdminPasswordStep || showStudentPasswordStep;
    return (
      <main className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_5%_90%,rgba(226,58,76,.09),transparent_34%),radial-gradient(ellipse_at_96%_8%,rgba(245,196,199,.35),transparent_31%),linear-gradient(135deg,#fff_15%,#fffafa_65%,#fff4f5)] px-6 pt-[38px] pb-[26px] motion-safe:animate-rise-in max-[760px]:px-[18px] max-[760px]:py-6 max-[420px]:px-3">
        <div className="w-[min(1054px,100%)]">
          <a className="brand [display:inline-flex] [align-items:center] [gap:10px]" href="#" aria-label="Suara Mandara">
            <Image
              className="login-brand-logo [width:58px] [height:58px] [padding:3px] [border:1px_solid_rgba(164,_119,_43,_.48)] [border-radius:50%] [background:#fff] [box-shadow:0_5px_16px_rgba(111,_32,_39,_.12)] [object-fit:contain] max-[760px]:[width:52px] max-[760px]:[height:52px]"
              src="/logo-smk-negeri-bali-mandara.png"
              alt="Lambang SMK Negeri Bali Mandara"
              width={64}
              height={64}
              priority
            />
            <span className="login-brand-copy [&_strong]:[display:block] [&_small]:[display:block] [&_strong]:[color:#7d242b] [&_strong]:[font:800_19px_'Manrope',_sans-serif] [&_strong]:[letter-spacing:-.6px] [&_small]:[margin-top:3px] [&_small]:[color:#96734a] [&_small]:[font-size:9px] [&_small]:[font-weight:600] [&_small]:[letter-spacing:.45px] max-[760px]:[&_strong]:[font-size:17px]">
              <strong>Suara Mandara</strong>
              <small>SMK Negeri Bali Mandara</small>
            </span>
          </a>

          <section className="grid min-h-[610px] grid-cols-[1.04fr_.96fr] overflow-hidden rounded-[17px] border border-[rgba(218,74,91,.1)] bg-white shadow-[0_24px_72px_rgba(109,41,47,.09),0_2px_8px_rgba(109,41,47,.035)] max-[760px]:mx-auto max-[760px]:max-w-[490px] max-[760px]:grid-cols-1">
            <div className="login-visual motion-safe:animate-rise-in [position:relative] [overflow:hidden] [display:flex] [flex-direction:column] [padding:38px_42px] [color:#492b30] [background:radial-gradient(ellipse_at_82%_72%,_rgba(216,_73,_91,_.12),_transparent_38%),_linear-gradient(145deg,_#fff_10%,_#fffafa_65%,_#fff2f3)] [&::before]:[content:''] [&::before]:[position:absolute] [&::before]:[width:290px] [&::before]:[height:290px] [&::before]:[border-radius:50%] [&::before]:[left:auto] [&::before]:[bottom:-182px] [&::before]:[background:rgba(209,_54,_72,_.07)] [&::after]:[content:''] [&::after]:[position:absolute] [&::after]:[width:145px] [&::after]:[height:145px] [&::after]:[border-radius:50%] [&::after]:[right:38px] [&::after]:[top:150px] [&::after]:[background:rgba(237,_177,_182,_.15)] [&_>_.eyebrow]:[z-index:1] [&_>_.eyebrow]:[display:flex] [&_>_.eyebrow]:[align-items:center] [&_>_.eyebrow]:[gap:9px] [&_>_.eyebrow]:[color:#97666c] max-[760px]:[min-height:410px] max-[760px]:[padding:26px_28px] [&_.live-dot]:[background:#d84c5c] [&_.live-dot]:[box-shadow:0_0_0_3px_rgba(216,_76,_92,_.13)] [&::before]:[right:-118px]" style={{ animationDelay: "90ms" }}>
              <span className="eyebrow [font-size:9px] [font-weight:700] [letter-spacing:1.15px]"><span className="live-dot [width:7px] [height:7px] [display:inline-block] [flex:0_0_auto] [border-radius:50%] [background:#cbe67c] [box-shadow:0_0_0_3px_rgba(203,_230,_124,_.13)]" /> PEMILIHAN KETUA DAN WAKIL ORGANISASI KESISWAAN SMKN BALI MANDARA MASA BAKTI 2026/2027</span>
              <div className="visual-heading [z-index:1] [margin-top:40px] [&_h1]:[margin:0] [&_h1]:[color:#38252a] [&_h1]:[font:900_clamp(43px,_5vw,_59px)/1.04_'Nunito',_'DM_Sans',_sans-serif] [&_h1]:[letter-spacing:-1.8px] [&_h1_span]:[color:#c93246] [&_p]:[max-width:315px] [&_p]:[margin:20px_0_0] [&_p]:[color:#806b6c] [&_p]:[font-size:12px] [&_p]:[line-height:1.8] max-[760px]:[margin-top:24px] max-[760px]:[&_h1]:[font-size:45px] max-[760px]:[&_p]:[max-width:255px] max-[760px]:[&_p]:[margin-top:11px] max-[760px]:[&_p]:[font-size:10px] max-[420px]:[&_h1]:[font-size:40px]">
                <h1>AYO PILIH<br />SESUAI ISI<br /><span>HATIMU</span></h1>
                <p>Setiap pilihan punya arti. Yuk, tentukan pemimpin yang paling mewakili harapanmu.</p>
              </div>
              <div className="visual-bottom [position:absolute] [inset:auto_0_0] [height:220px] [overflow:hidden] max-[760px]:[height:143px]">
                <span className="visual-decoration visual-decoration-one motion-safe:animate-float [position:absolute] [display:block] [border-radius:50%] [pointer-events:none] [width:175px] [height:175px] [right:65px] [bottom:-112px] [background:linear-gradient(145deg,_rgba(205,_51,_70,_.12),_rgba(235,_137,_146,_.24))] max-[760px]:[width:120px] max-[760px]:[height:120px] max-[760px]:[right:35px] max-[760px]:[bottom:-72px]" aria-hidden="true" />
                <span className="visual-decoration visual-decoration-two motion-safe:animate-float [position:absolute] [display:block] [border-radius:50%] [pointer-events:none] [width:98px] [height:98px] [right:200px] [bottom:69px] [background:linear-gradient(145deg,_rgba(226,_130,_139,_.2),_rgba(248,_226,_228,_.42))] max-[760px]:[width:67px] max-[760px]:[height:67px] max-[760px]:[right:136px] max-[760px]:[bottom:40px]" aria-hidden="true" />
                <div className="election-note [position:absolute] [z-index:1] [right:36px] [bottom:35px] [display:flex] [align-items:center] [gap:12px] [padding:14px_18px] [border:1px_solid_rgba(202,_71,_85,_.11)] [border-radius:12px] [background:rgba(255,_255,_255,_.92)] [box-shadow:0_12px_30px_rgba(109,_41,_47,_.08)] [&_strong]:[display:block] [&_small]:[display:block] [&_strong]:[color:#584145] [&_strong]:[font-size:10px] [&_small]:[margin-top:5px] [&_small]:[color:#a17d80] [&_small]:[font-size:8px] [&_small]:[letter-spacing:.5px] max-[760px]:[right:23px] max-[760px]:[bottom:21px] max-[760px]:[gap:8px] max-[760px]:[padding:9px_11px]">
                  <span className="election-note-icon motion-safe:animate-soft-pulse [width:34px] [height:34px] [border-radius:10px] [display:grid] [place-items:center] [color:#b93043] [background:#fff0f1] [font-size:17px] [font-weight:700] max-[760px]:[width:29px] max-[760px]:[height:29px]" aria-hidden="true">✓</span>
                  <span><strong>Satu suara berarti</strong><small>MPK&nbsp; · &nbsp;OSIS&nbsp; · &nbsp;KY</small></span>
                </div>
                <span className="visual-footnote [position:absolute] [right:auto] [bottom:19px] [color:#a17d80] [font-size:7px] [letter-spacing:1px] max-[760px]:[bottom:17px] max-[760px]:[right:24px] [left:42px] max-[760px]:[left:23px] max-[760px]:[max-width:125px] max-[760px]:[font-size:6px] max-[760px]:[line-height:1.5]">PEMILIHAN ORGANISASI KESISWAAN SEKOLAH</span>
              </div>
            </div>

            <div className="login-form-panel motion-safe:animate-content-in [position:relative] [display:flex] [flex-direction:column] [padding:37px_46px_25px] max-[760px]:[min-height:448px] max-[760px]:[padding:28px] max-[420px]:[padding-right:21px] max-[420px]:[padding-left:21px] [&_.primary-button]:[background:#c93246] [&_.primary-button:hover:not(:disabled)]:[background:#ad293b] [&_.primary-button:focus-visible]:[outline-color:#e7a0a7]" style={{ animationDelay: "180ms" }}>
              <div className="form-topline [display:flex] [justify-content:space-between] [align-items:center] [color:#9a8587] [font-size:8px] [font-weight:700] [letter-spacing:1px]">
                <span>{showAdminPasswordStep ? "PORTAL ADMIN" : "PORTAL PEMILIH"}</span>
                <span className="secure-label [color:#97565f] [&_span]:[color:#cb5260]"><span>✦</span> SUARA MANDARA</span>
              </div>
              <div key={showPasswordStep ? (showAdminPasswordStep ? "admin" : "student-password") : "student"} className="form-heading motion-safe:animate-content-in [position:relative] [margin-top:58px] [&_>_p]:[margin:16px_0_6px] [&_>_p]:[color:#927d7e] [&_>_p]:[font-size:12px] [&_h2]:[margin:0] [&_h2]:[color:#37282b] [&_h2]:[font:700_29px/1.16_'Manrope',_sans-serif] [&_h2]:[letter-spacing:-1.2px] max-[760px]:[margin-top:35px] max-[760px]:[&_h2]:[font-size:27px] [&_h2]:[font-family:'Nunito',_'DM_Sans',_sans-serif] [&_h2]:[font-weight:800]">
                <span className="form-icon [width:25px] [height:25px] [border-radius:8px] [display:grid] [place-items:center] [color:#b63d4d] [background:#fff0f1] [font-size:16px]">{showPasswordStep ? "▣" : "↗"}</span>
                <p>{showAdminPasswordStep ? "Selamat datang, admin!" : "Selamat datang, pemilih!"}</p>
                <h2>
                  {showAdminPasswordStep ? <>Masukkan password<br />admin.</> : showStudentPasswordStep ? <>Masukkan password<br />pemilih.</> : <>Mulai dari<br />suaramu.</>}
                </h2>
                <span className="form-subtitle [display:block] [margin-top:10px] [color:#897a7b] [font-size:11px] [line-height:1.6]">
                  {showAdminPasswordStep
                    ? "Masukkan password untuk membuka rekap suara."
                    : showStudentPasswordStep
                      ? "Masukkan password untuk melanjutkan pemilihan."
                    : "Masukkan NIS untuk melanjutkan pemilihan."}
                </span>
              </div>
              <form className="login-form [display:flex] [flex-direction:column] [margin-top:24px] [&_label]:[margin:0_0_8px] [&_label]:[color:#5a4548] [&_label]:[font-size:10px] [&_label]:[font-weight:700]" onSubmit={handleLogin}>
                {showPasswordStep ? (
                  <>
                    {showAdminPasswordStep ? (
                      <div className="admin-account motion-safe:animate-content-in [display:flex] [align-items:center] [gap:10px] [margin:0_0_18px] [padding:10px] [border:1px_solid_#f0e2e0] [border-radius:8px] [background:#fffafa] [&_>_span:nth-child(2)]:[min-width:0] [&_>_span:nth-child(2)]:[flex:1] [&_strong]:[display:block] [&_small]:[display:block] [&_strong]:[color:#57383a] [&_strong]:[font-size:10px] [&_small]:[margin-top:3px] [&_small]:[color:#9c8583] [&_small]:[font-size:8px]">
                        <span className="admin-account-avatar [width:31px] [height:31px] [border-radius:50%] [display:grid] [flex:0_0_auto] [place-items:center] [color:#fff8e6] [background:linear-gradient(145deg,_#8f282e,_#c44a46)] [font-size:12px] [font-weight:700]">A</span>
                        <span><strong>admin</strong><small>Masuk sebagai pengelola</small></span>
                        <button
                          type="button"
                          className="change-admin-button [padding:6px_8px] [border:0] [border-radius:5px] [color:#a13740] [background:#f9e9e9] [font-size:8px] [font-weight:700] [cursor:pointer] [&:hover]:[background:#f3d9db]"
                          onClick={() => {
                            setAdminPasswordStep(false);
                            setPassword("");
                            setLoginError("");
                          }}
                        >
                          Kembali
                        </button>
                      </div>
                    ) : (
                      <div className="admin-account [display:flex] [align-items:center] [gap:10px] [margin:0_0_18px] [padding:10px] [border:1px_solid_#f0e2e0] [border-radius:8px] [background:#fffafa]">
                        <span className="admin-account-avatar [width:31px] [height:31px] [border-radius:50%] [display:grid] [flex:0_0_auto] [place-items:center] [color:#fff8e6] [background:linear-gradient(145deg,_#8f282e,_#c44a46)] [font-size:12px] [font-weight:700]">{studentName.trim().charAt(0).toUpperCase()}</span>
                        <span className="[min-width:0] [flex:1]"><strong className="[display:block] [color:#57383a] [font-size:10px]">{studentName}</strong><small className="[display:block] [margin-top:3px] [color:#9c8583] [font-size:8px]">Masuk sebagai pemilih</small></span>
                        <button
                          type="button"
                          className="change-admin-button [padding:6px_8px] [border:0] [border-radius:5px] [color:#a13740] [background:#f9e9e9] [font-size:8px] [font-weight:700] [cursor:pointer] [&:hover]:[background:#f3d9db]"
                          onClick={() => {
                            setStudentPasswordStep(false);
                            setPassword("");
                            setLoginError("");
                          }}
                        >
                          Kembali
                        </button>
                      </div>
                    )}
                    <label htmlFor={showAdminPasswordStep ? "admin-password" : "student-password"}>
                      {showAdminPasswordStep ? "Password admin" : "Password pemilih"}
                    </label>
                    <div className="input-wrap [height:43px] [display:flex] [align-items:center] [gap:10px] [margin-bottom:8px] [padding:0_12px] [border:1px_solid_#e8ebe4] [border-radius:7px] [background:#fffdfd] [transition:border-color_.2s,_box-shadow_.2s,_transform_.2s] [&:focus-within]:[border-color:#db7a84] [&:focus-within]:[box-shadow:0_0_0_3px_rgba(219,_122,_132,_.13)] [&_input]:[width:100%] [&_input]:[padding:0] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[color:#453337] [&_input]:[background:transparent] [&_input]:[font-size:10px] [&_input::placeholder]:[color:#b7a9aa] [border-color:#eee5e5]">
                      <span className="input-icon lock-icon [color:#a37d80] [font-size:13px]" aria-hidden="true">▣</span>
                      <input
                        ref={showAdminPasswordStep ? adminPasswordRef : studentPasswordRef}
                        id={showAdminPasswordStep ? "admin-password" : "student-password"}
                        name="password"
                        type="password"
                        inputMode={showStudentPasswordStep ? "numeric" : undefined}
                        autoComplete="current-password"
                        placeholder={showAdminPasswordStep ? "Masukkan password admin" : "Masukkan password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        maxLength={showStudentPasswordStep ? 5 : undefined}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <label htmlFor="nis">Nomor Induk Siswa (NIS)</label>
                    <div className="input-wrap [height:43px] [display:flex] [align-items:center] [gap:10px] [margin-bottom:16px] [padding:0_12px] [border:1px_solid_#e8ebe4] [border-radius:7px] [background:#fffdfd] [transition:border-color_.2s,_box-shadow_.2s,_transform_.2s] [&:focus-within]:[border-color:#db7a84] [&:focus-within]:[box-shadow:0_0_0_3px_rgba(219,_122,_132,_.13)] [&:focus-within_.input-icon]:[color:#63814d] [&:focus-within_.input-icon]:[transform:scale(1.08)] [&_input]:[width:100%] [&_input]:[padding:0] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[color:#453337] [&_input]:[background:transparent] [&_input]:[font-size:10px] [&_input::placeholder]:[color:#b7a9aa] [border-color:#eee5e5]">
                      <span className="input-icon nis-icon [color:#a37d80] [font-size:15px]" aria-hidden="true">#</span>
                      <input
                        id="nis"
                        name="nis"
                        type="text"
                        inputMode="text"
                        autoCapitalize="none"
                        autoComplete="off"
                        placeholder="Masukkan NIS kamu"
                        value={nis}
                        maxLength={5}
                        onChange={(event) => {
                          setNis(event.target.value);
                          setAdminPasswordStep(false);
                          setStudentPasswordStep(false);
                          setStudentName("");
                          setLoginError("");
                          setPassword("");
                        }}
                        required
                      />
                    </div>
                  </>
                )}
                {loginError && <p className="form-error [margin:-7px_0_10px] [color:#b6473d] [font-size:10px]" role="alert">{loginError}</p>}
                {appError && <p className="form-error [margin:-7px_0_10px] [color:#b6473d] [font-size:10px]" role="alert">{appError}</p>}
                <button className="primary-button login-button [height:44px] [border:0] [border-radius:7px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:14px] [color:#f9faef] [background:#17483b] [font-size:10px] [font-weight:700] [cursor:pointer] [transition:background_.2s,_transform_.2s,_box-shadow_.2s,_opacity_.2s] [&:hover:not(:disabled)]:[background:#225d4b] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:active:not(:disabled)]:[transform:translateY(0)_scale(.98)] [&:disabled]:[cursor:wait] [&:focus-visible]:[outline:3px_solid_#b5cd79] [&:focus-visible]:[outline-offset:3px] [&_span]:[font-size:15px] [&_span]:[font-weight:400]" type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Memeriksa data..."
                    : showPasswordStep
                      ? showAdminPasswordStep
                      ? "Masuk ke halaman admin"
                      : "Masuk & mulai memilih"
                      : "Lanjut ke password"} {isSubmitting ? (
                    <span className="button-spinner motion-safe:animate-spin [width:13px] [height:13px] [flex:0_0_auto] [border:2px_solid_rgba(255,255,255,.4)] [border-top-color:currentColor] [border-radius:50%]" aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">→</span>
                  )}
                </button>
              </form>
              <p className="login-hint [display:flex] [gap:8px] [margin:15px_0_0] [color:#8d7e7f] [font-size:9px] [line-height:1.5] [&_span]:[color:#cf5261]"><span>✳</span> Gunakan hak pilihmu dengan bijak untuk menentukan pemimpin organisasi kesiswaan.</p>
              <p className="demo-notice [margin:8px_0_0_16px] [color:#a18e8f] [font-size:8px]">Setiap suara berharga. Pilih calon yang paling mewakili aspirasi siswa.</p>
              <div className="login-footer [margin-top:auto] [padding-top:25px] [border-top:1px_solid_#f0f1ec] [display:flex] [justify-content:space-between] [color:#a28f90] [font-size:8px] [border-color:#f1e9e9]"><span>© 2026 Suara Mandara</span><span>Suaramu berarti <span className="heart [color:#d48072]">♥</span></span></div>
            </div>
          </section>
          <div className="login-bottom-note [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [gap:5px] [margin-top:17px] [color:#9c8284] [font-size:8px] [font-weight:600] [letter-spacing:1px]"><span><span className="tiny-spark [color:#cf5261]">✳</span> SATU SISWA, SATU SUARA, SUARA MANDARA.</span><span className="[color:#8e7779] [font-size:9px] [font-weight:500] [letter-spacing:.2px]">Dikembangkan oleh Dhika Sumarta dan Dean Putra</span></div>
        </div>
      </main>
    );
  }

  if (role === "admin") {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <main className="min-h-screen">
      <header className="flex h-[70px] items-center justify-between border-b border-[#e9ebe4] bg-[rgba(255,255,255,.82)] px-8 motion-safe:animate-fade-in min-[1124px]:px-[calc((100vw-1060px)/2)] max-[760px]:h-[62px] max-[760px]:px-5">
        <a className="brand [display:inline-flex] [align-items:center] [gap:10px]" href="#" aria-label="Suara Mandara">
          <span className="brand-mark [width:30px] [height:30px] [border-radius:10px_10px_10px_3px] [display:grid] [place-items:center] [background:#c93246] [transform:rotate(-8deg)] [&_>_span]:[width:12px] [&_>_span]:[height:12px] [&_>_span]:[border:2px_solid_var(--lime)] [&_>_span]:[border-radius:50%] [&_>_span]:[position:relative] [&_>_span::after]:[content:''] [&_>_span::after]:[width:4px] [&_>_span::after]:[height:4px] [&_>_span::after]:[border-radius:50%] [&_>_span::after]:[position:absolute] [&_>_span::after]:[background:#fff] [&_>_span::after]:[left:2px] [&_>_span::after]:[top:2px] [&_>_span]:[border-color:#fff]"><span /></span>
          <span className="brand-copy [font:800_20px_'Manrope',_sans-serif] [letter-spacing:-1.2px] [&_>_span]:[color:#c93246]">suara<span>mandara</span></span>
        </a>
        <span className="header-election [display:flex] [align-items:center] [gap:9px] [color:#7d877f] [font-size:9px] [font-weight:700] [letter-spacing:.9px] [&_.live-dot]:[width:6px] [&_.live-dot]:[height:6px] [&_.live-dot]:[background:#90ad61] [&_.live-dot]:[box-shadow:0_0_0_3px_#eff4e5] max-[760px]:[display:none]"><span className="live-dot [width:7px] [height:7px] [display:inline-block] [flex:0_0_auto] [border-radius:50%] [background:#cbe67c] [box-shadow:0_0_0_3px_rgba(203,_230,_124,_.13)]" /> PEMILIHAN SISWA 2026/2027</span>
        <button className="profile-button [display:flex] [align-items:center] [gap:9px] [padding:0] [border:0] [background:transparent] [text-align:left] [cursor:pointer]" onClick={() => {
          void handleLogout().catch((error: unknown) => {
            setAppError(error instanceof Error ? error.message : "Gagal keluar dari aplikasi.");
          });
        }} title="Keluar">
          <span className="profile-avatar [width:32px] [height:32px] [border-radius:50%] [display:grid] [place-items:center] [color:#315940] [background:#e6edda] [font-size:10px] [font-weight:700]">{voter.slice(0, 2).toUpperCase()}</span>
          <span className="profile-name [color:#34473d] [font-size:10px] [font-weight:700] [&_small]:[display:block] [&_small]:[margin-top:2px] [&_small]:[color:#9aa29b] [&_small]:[font-size:8px] [&_small]:[font-weight:400]">{voter}<small>Pemilih</small></span>
          <span className="logout-icon [margin-left:7px] [color:#89958b] [font-size:16px] [transform:rotate(90deg)]" aria-hidden="true">↗</span>
        </button>
      </header>

      <div className={`app-content ${isMpkPoster || isPairPoster || isElectionCompletedScreen ? "mpk-poster-content [padding-bottom:125px] max-[760px]:[width:calc(100%_-_36px)] max-[760px]:[padding-bottom:116px] max-[420px]:[padding-bottom:85px]" : ""}`}>
        {isMpkPoster ? (
          <section className="mpk-poster-page [padding:42px_0_34px] max-[760px]:[padding-top:24px]" aria-labelledby="mpk-poster-title">
            <header className="mpk-poster-heading motion-safe:animate-content-in [position:relative] [margin-bottom:24px] [padding:29px_32px] [border:1px_solid_#f1dfdf] [border-radius:14px] [background:radial-gradient(ellipse_at_92%_10%,_rgba(201,_50,_70,_.1),_transparent_34%),_linear-gradient(120deg,_#fff_20%,_#fff8f8)] [&_.eyebrow]:[color:#a76b70] [&_.live-dot]:[background:#c93246] [&_.live-dot]:[box-shadow:0_0_0_3px_rgba(201,_50,_70,_.12)] [&_h1]:[margin:11px_0_6px] [&_h1]:[color:#37282b] [&_h1]:[font:800_clamp(27px,_4vw,_39px)/1.1_'Nunito',_'DM_Sans',_sans-serif] [&_h1]:[letter-spacing:-1.3px] [&_>_p]:[margin:0] [&_>_p]:[color:#897a7b] [&_>_p]:[font-size:11px] max-[760px]:[padding:23px_20px] max-[760px]:[&_h1]:[max-width:70%] max-[420px]:[padding:20px_14px] max-[420px]:[&_h1]:[max-width:100%] max-[420px]:[&_h1]:[padding-right:0] max-[420px]:[&_h1]:[font-size:27px]">
              <span className="eyebrow dark-eyebrow [font-size:9px] [font-weight:700] [letter-spacing:1.15px] [color:#849177]"><span className="live-dot [width:7px] [height:7px] [display:inline-block] [flex:0_0_auto] [border-radius:50%] [background:#cbe67c] [box-shadow:0_0_0_3px_rgba(203,_230,_124,_.13)]" /> PEMILIHAN CALON {mpkPosterPositionLabel.toUpperCase()} MPK 2026/2027</span>
              <h1 id="mpk-poster-title">Kenali calon {mpkPosterPositionLabel} MPK</h1>
              <p>Pilih dengan cermat calon yang paling mewakili aspirasi kelasmu.</p>
              <div className="mpk-poster-notice [margin-top:16px] [padding:10px_12px] [border:1px_solid_#f1e2c6] [border-radius:7px] [color:#795a2d] [background:#fffaf0] [font-size:9px] [line-height:1.5]" role="note">
                Foto atau visi-misi yang belum diatur admin ditampilkan sebagai ilustrasi atau contoh. Hanya calon terdaftar yang dapat dipilih.
              </div>
              <span className="mpk-poster-count [position:absolute] [top:31px] [right:32px] [padding:8px_11px] [border:1px_solid_#f0d7d9] [border-radius:20px] [color:#a93646] [background:#fff] [font-size:9px] [font-weight:700] max-[760px]:[top:25px] max-[760px]:[right:18px] max-[760px]:[font-size:8px] max-[420px]:[position:static] max-[420px]:[display:inline-block] max-[420px]:[margin-top:11px]">
                {mpkPosterCandidates.length} calon terdaftar
              </span>
            </header>
            {appError && <p className="form-error app-error [margin:-7px_0_10px] [color:#b6473d] [font-size:10px] [width:fit-content] [margin:14px_0_0] [padding:9px_12px] [border:1px_solid_#f0d7d9] [border-radius:6px] [background:#fff7f7]" role="alert">{appError}</p>}
            <div className="mpk-poster-grid [display:grid] [grid-template-columns:repeat(5,_minmax(0,_1fr))] [gap:13px] max-[900px]:[grid-template-columns:repeat(3,_minmax(0,_1fr))] max-[760px]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[760px]:[gap:10px] max-[420px]:[gap:8px]">
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
                    className={`mpk-poster-card motion-safe:animate-poster-in transition-[transform,border-color,box-shadow] duration-300 motion-reduce:animate-none motion-reduce:transform-none  [min-width:0] [overflow:hidden] [padding:0] [border:1px_solid_#e9ebe4] [border-radius:11px] [background:#fff] [text-align:left] [box-shadow:0_5px_16px_rgba(32,_54,_43,_.035)] [transition:transform_.18s,_border-color_.18s,_box-shadow_.18s] [&:not(:disabled)]:[cursor:pointer] [&:not(:disabled):hover]:[transform:translateY(-3px)] [&:not(:disabled):hover]:[border-color:#d7a1a7] [&:not(:disabled):hover]:[box-shadow:0_10px_22px_rgba(115,_49,_56,_.09)] [&.selected]:[border-color:#bd3548] [&.selected]:[box-shadow:0_0_0_2px_rgba(189,_53,_72,_.12)] [&.selected_.mpk-poster-select]:[border-color:#bd3548] [&.selected_.mpk-poster-select]:[color:#fff] [&.selected_.mpk-poster-select]:[background:#bd3548] [&.unregistered]:[background:#fbfbf9] [&.unregistered_.mpk-poster-portrait]:[filter:saturate(.55)] [&:disabled]:[cursor:not-allowed]${isSelected ? "selected" : ""} ${candidate ? "" : "unregistered"}`}
                    key={candidate?.id ?? `mpk-chair-placeholder-${index}`}
                    style={{ animationDelay: `${Math.min(index, 9) * 55}ms` }}
                    type="button"
                    disabled={!candidate || isSubmitting}
                    onClick={() => {
                      if (!candidate || !mpkPosterPosition) return;
                      setSelectedMpkPosition(mpkPosterPosition);
                      setSelectedCandidate(candidate.id);
                    }}
                    aria-pressed={Boolean(candidate && isSelected)}
                  >
                    <span className="mpk-poster-card-top [display:flex] [align-items:center] [justify-content:space-between] [padding:10px_11px] [color:#9c7376] [font-size:7px] [font-weight:800] [letter-spacing:.7px] [&_strong]:[display:grid] [&_strong]:[width:23px] [&_strong]:[height:23px] [&_strong]:[place-items:center] [&_strong]:[border-radius:50%] [&_strong]:[color:#a93646] [&_strong]:[background:#fff0f1] [&_strong]:[font-size:9px] max-[420px]:[padding:8px] max-[420px]:[font-size:6px]">
                      <span>CALON {mpkPosterPositionLabel.toUpperCase()} MPK</span>
                      <strong>{String(index + 1).padStart(2, "0")}</strong>
                    </span>
                    <span className="mpk-poster-portrait [position:relative] [display:grid] [height:152px] [margin:0_9px] [overflow:hidden] [place-items:center] [border-radius:7px] [background:linear-gradient(145deg,_color-mix(in_srgb,_currentColor_12%,_white),_color-mix(in_srgb,_currentColor_35%,_white))] [&::before]:[position:absolute] [&::before]:[width:125px] [&::before]:[height:125px] [&::before]:[border:1px_solid_rgba(255,255,255,.62)] [&::before]:[border-radius:50%] [&::before]:[content:''] [&::after]:[position:absolute] [&::after]:[width:170px] [&::after]:[height:170px] [&::after]:[border:1px_solid_rgba(255,255,255,.62)] [&::after]:[border-radius:50%] [&::after]:[content:''] [&::before]:[top:19px] [&::before]:[left:-61px] [&::after]:[right:-66px] [&::after]:[bottom:-72px] [&_svg]:[position:relative] [&_svg]:[z-index:1] [&_svg]:[width:100%] [&_svg]:[height:100%] [&_svg]:[padding:13px_10px_0] [&_.mpk-poster-photo]:[position:relative] [&_.mpk-poster-photo]:[z-index:1] [&_.mpk-poster-photo]:[width:100%] [&_.mpk-poster-photo]:[height:100%] [&_.mpk-poster-photo]:[object-fit:cover] max-[760px]:[height:155px] max-[420px]:[height:125px] max-[420px]:[margin:0_6px]" style={{ color: program.accent }}>
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
                      <span className="mpk-poster-photo-label [position:absolute] [right:7px] [bottom:7px] [z-index:2] [padding:4px_6px] [border-radius:4px] [color:#745a59] [background:rgba(255,255,255,.86)] [font-size:6px] [font-weight:800] [letter-spacing:.6px]">{candidate?.photoDataUrl ? "FOTO" : "ILUSTRASI"}</span>
                    </span>
                    <span className="mpk-poster-card-content [display:flex] [flex-direction:column] [padding:11px_11px_0] max-[420px]:[padding:9px_8px_0]">
                      <strong className="mpk-poster-name [min-height:31px] [color:#35473d] [font:800_12px/1.3_'Manrope',_sans-serif] [overflow-wrap:anywhere] max-[420px]:[font-size:10px]">{candidateName}</strong>
                      {!candidate && <span className="mpk-poster-unregistered [margin:4px_0_3px] [color:#a1662a] [font-size:7px] [font-weight:700] [line-height:1.4]">Belum terdaftar oleh admin</span>}
                      <span className="mpk-poster-copy-label [margin-top:9px] [color:#a93646] [font-size:7px] [font-weight:800] [letter-spacing:.65px] [text-transform:uppercase]">Visi{vision ? "" : " · Contoh"}</span>
                      <span className="mpk-poster-vision [margin-top:4px] [color:#657269] [font-size:8px] [line-height:1.5] max-[420px]:[font-size:7px]">{vision || program.vision}</span>
                      <span className="mpk-poster-copy-label [margin-top:9px] [color:#a93646] [font-size:7px] [font-weight:800] [letter-spacing:.65px] [text-transform:uppercase]">Misi{mission ? "" : " · Contoh"}</span>
                      <span className="mpk-poster-missions [display:grid] [gap:4px] [margin-top:5px] [&_>_span]:[position:relative] [&_>_span]:[padding-left:10px] [&_>_span]:[color:#657269] [&_>_span]:[font-size:7px] [&_>_span]:[line-height:1.45] [&_>_span::before]:[position:absolute] [&_>_span::before]:[top:0] [&_>_span::before]:[left:0] [&_>_span::before]:[color:#bd3548] [&_>_span::before]:[content:'•'] max-[420px]:[&_>_span]:[font-size:6px]">
                        {(mission
                          ? mission.split(/\n+/).map((item) => item.trim()).filter(Boolean)
                          : program.missions
                        ).map((item) => <span key={item}>{item}</span>)}
                      </span>
                    </span>
                    <span className={`mpk-poster-select [display:block] [margin:11px_10px_10px] [padding:8px_5px] [border:1px_solid_#eee6e3] [border-radius:6px] [color:#738076] [font-size:8px] [font-weight:700] [text-align:center] max-[420px]:[margin-right:7px] max-[420px]:[margin-left:7px] ${isSelected ? "[border-color:#bd3548] [color:#fff] [background:#bd3548]" : ""}`}>
                      {isSelected ? "✓ Dipilih" : candidate ? "Pilih calon" : "Belum tersedia"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : isElectionCompletedScreen ? (
          <section className="mpk-completion-page [display:grid] [min-height:calc(100svh_-_153px)] [place-items:center] [padding:42px_0] max-[420px]:[min-height:calc(100svh_-_150px)] max-[420px]:[padding:25px_0]" aria-labelledby="election-completion-title">
            <div className="mpk-completion-card motion-safe:animate-modal-in [position:relative] [display:flex] [width:min(680px,_100%)] [min-height:420px] [align-items:center] [flex-direction:column] [justify-content:center] [overflow:hidden] [padding:56px_42px] [border:1px_solid_#f1dfdf] [border-radius:22px] [background:radial-gradient(ellipse_at_50%_0,_rgba(201,_50,_70,_.11),_transparent_45%),_linear-gradient(155deg,_#fff_20%,_#fff8f8)] [text-align:center] [box-shadow:0_18px_50px_rgba(81,_35,_40,_.075)] [&::before]:[position:absolute] [&::before]:[width:230px] [&::before]:[height:230px] [&::before]:[border:1px_solid_rgba(201,_50,_70,_.12)] [&::before]:[border-radius:50%] [&::before]:[content:''] [&::before]:[pointer-events:none] [&::after]:[position:absolute] [&::after]:[width:270px] [&::after]:[height:270px] [&::after]:[border:1px_solid_rgba(201,_50,_70,_.12)] [&::after]:[border-radius:50%] [&::after]:[content:''] [&::after]:[pointer-events:none] [&::before]:[top:-145px] [&::before]:[left:-100px] [&::before]:[box-shadow:0_0_0_18px_rgba(201,_50,_70,_.025),_0_0_0_38px_rgba(201,_50,_70,_.02)] [&::after]:[right:-120px] [&::after]:[bottom:-155px] [&::after]:[box-shadow:0_0_0_20px_rgba(201,_50,_70,_.025)] [&_h1]:[max-width:530px] [&_h1]:[margin:13px_0_12px] [&_h1]:[color:#432d31] [&_h1]:[font:900_clamp(32px,_5vw,_46px)/1.08_'Nunito',_'Manrope',_sans-serif] [&_h1]:[letter-spacing:-1.7px] [&_p]:[max-width:430px] [&_p]:[margin:0] [&_p]:[color:#897a7b] [&_p]:[font-size:13px] [&_p]:[line-height:1.8] max-[420px]:[min-height:390px] max-[420px]:[padding:42px_20px] max-[420px]:[border-radius:17px] max-[420px]:[&_h1]:[font-size:clamp(29px,_8vw,_36px)] max-[420px]:[&_h1]:[letter-spacing:-1.2px] max-[420px]:[&_p]:[font-size:11px]">
              <span className="mpk-completion-spark mpk-completion-spark-one motion-safe:animate-float [position:absolute] [color:#d78a93] [pointer-events:none] [top:24%] [left:16%] [font-size:24px] [opacity:.8] max-[420px]:[left:9%]" aria-hidden="true">✳</span>
              <span className="mpk-completion-spark mpk-completion-spark-two motion-safe:animate-float [position:absolute] [color:#d78a93] [pointer-events:none] [right:17%] [bottom:23%] [color:#cf727f] [font-size:19px] [opacity:.8] max-[420px]:[right:10%]" aria-hidden="true" style={{ animationDelay: "450ms" }}>✦</span>
              <span className="mpk-completion-check-wrap motion-safe:animate-success-pop [position:relative] [display:grid] [width:94px] [height:94px] [place-items:center] [margin-bottom:23px] [border:1px_solid_rgba(201,_50,_70,_.17)] [border-radius:50%] [background:rgba(255,255,255,.78)] [box-shadow:0_0_0_10px_rgba(201,_50,_70,_.045),_0_9px_24px_rgba(115,_49,_56,_.09)] max-[420px]:[width:82px] max-[420px]:[height:82px]">
                <span className="mpk-completion-check motion-safe:animate-check-pop [display:grid] [width:66px] [height:66px] [place-items:center] [border-radius:50%] [color:#fff] [background:linear-gradient(145deg,_#e45b6b,_#bd3548)] [font:700_34px_'Manrope',_sans-serif] [box-shadow:inset_0_1px_0_rgba(255,255,255,.28)] max-[420px]:[width:58px] max-[420px]:[height:58px] max-[420px]:[font-size:30px]" aria-hidden="true">✓</span>
              </span>
              <span className="mpk-completion-eyebrow [color:#a93646] [font-size:9px] [font-weight:800] [letter-spacing:1.8px]">PEMILIHAN {currentOrganization.name} SELESAI</span>
              <h1 id="election-completion-title">Suara {currentOrganization.name} sudah tercatat</h1>
              <p>Terima kasih atas partisipasinya! Anda telah memilih:</p>
              <div className="mpk-completion-choices [display:flex] [flex-wrap:wrap] [justify-content:center] [gap:10px] [margin-top:25px] [&_span]:[display:inline-flex] [&_span]:[align-items:center] [&_span]:[gap:7px] [&_span]:[min-height:35px] [&_span]:[padding:0_13px] [&_span]:[border:1px_solid_#f1dfdf] [&_span]:[border-radius:20px] [&_span]:[color:#86585e] [&_span]:[background:rgba(255,255,255,.85)] [&_span]:[font-size:9px] [&_span]:[font-weight:700] [&_i]:[display:grid] [&_i]:[width:17px] [&_i]:[height:17px] [&_i]:[place-items:center] [&_i]:[border-radius:50%] [&_i]:[color:#fff] [&_i]:[background:#c83d50] [&_i]:[font-size:10px] [&_i]:[font-style:normal]" aria-label={`Pilihan ${currentOrganization.name} sudah tercatat`}>
                {activeOrganization === "mpk" ? (
                  <>
                    <span className="motion-safe:animate-content-in" style={{ animationDelay: "220ms" }}><i aria-hidden="true">✓</i> Ketua MPK: {selectedMpkChair?.name ?? "Calon MPK"}</span>
                    <span className="motion-safe:animate-content-in" style={{ animationDelay: "300ms" }}><i aria-hidden="true">✓</i> Wakil MPK: {selectedMpkVice?.name ?? "Calon MPK"}</span>
                  </>
                ) : (
                  <span className="motion-safe:animate-content-in" style={{ animationDelay: "220ms" }}><i aria-hidden="true">✓</i> {selectedPairCandidate ? `Paslon ${selectedPairCandidate.number}: ${selectedPairCandidate.name} & ${selectedPairCandidate.viceName}` : `Paslon ${currentOrganization.name}`}</span>
                )}
              </div>
              {appError && <p className="form-error app-error [margin:-7px_0_10px] [color:#b6473d] [font-size:10px] [width:fit-content] [margin:14px_0_0] [padding:9px_12px] [border:1px_solid_#f0d7d9] [border-radius:6px] [background:#fff7f7]" role="alert">{appError}</p>}
            </div>
          </section>
        ) : isPairPoster ? (
          <section className="mpk-poster-page pair-poster-page [padding:42px_0_34px] max-[760px]:[padding-top:24px] [max-width:920px] [margin:0_auto]" aria-labelledby="pair-poster-title">
            <header className="mpk-poster-heading motion-safe:animate-content-in [position:relative] [margin-bottom:24px] [padding:29px_32px] [border:1px_solid_#f1dfdf] [border-radius:14px] [background:radial-gradient(ellipse_at_92%_10%,_rgba(201,_50,_70,_.1),_transparent_34%),_linear-gradient(120deg,_#fff_20%,_#fff8f8)] [&_.eyebrow]:[color:#a76b70] [&_.live-dot]:[background:#c93246] [&_.live-dot]:[box-shadow:0_0_0_3px_rgba(201,_50,_70,_.12)] [&_h1]:[margin:11px_0_6px] [&_h1]:[color:#37282b] [&_h1]:[font:800_clamp(27px,_4vw,_39px)/1.1_'Nunito',_'DM_Sans',_sans-serif] [&_h1]:[letter-spacing:-1.3px] [&_>_p]:[margin:0] [&_>_p]:[color:#897a7b] [&_>_p]:[font-size:11px] max-[760px]:[padding:23px_20px] max-[760px]:[&_h1]:[max-width:70%] max-[420px]:[padding:20px_14px] max-[420px]:[&_h1]:[max-width:100%] max-[420px]:[&_h1]:[padding-right:0] max-[420px]:[&_h1]:[font-size:27px]">
              <span className="eyebrow dark-eyebrow [font-size:9px] [font-weight:700] [letter-spacing:1.15px] [color:#849177]"><span className="live-dot [width:7px] [height:7px] [display:inline-block] [flex:0_0_auto] [border-radius:50%] [background:#cbe67c] [box-shadow:0_0_0_3px_rgba(203,_230,_124,_.13)]" /> PEMILIHAN {currentOrganization.name} 2026/2027</span>
              <h1 id="pair-poster-title">Kenali paslon {currentOrganization.name}</h1>
              <p>Pilih satu pasangan calon ketua dan wakil yang paling mewakili harapanmu.</p>
              <div className="mpk-poster-notice [margin-top:16px] [padding:10px_12px] [border:1px_solid_#f1e2c6] [border-radius:7px] [color:#795a2d] [background:#fffaf0] [font-size:9px] [line-height:1.5]" role="note">
                Foto atau visi-misi yang belum diatur admin ditampilkan sebagai ilustrasi atau contoh.
              </div>
              <span className="mpk-poster-count [position:absolute] [top:31px] [right:32px] [padding:8px_11px] [border:1px_solid_#f0d7d9] [border-radius:20px] [color:#a93646] [background:#fff] [font-size:9px] [font-weight:700] max-[760px]:[top:25px] max-[760px]:[right:18px] max-[760px]:[font-size:8px] max-[420px]:[position:static] max-[420px]:[display:inline-block] max-[420px]:[margin-top:11px]">{pairPosterCandidates.length} paslon</span>
            </header>
            {appError && <p className="form-error app-error [margin:-7px_0_10px] [color:#b6473d] [font-size:10px] [width:fit-content] [margin:14px_0_0] [padding:9px_12px] [border:1px_solid_#f0d7d9] [border-radius:6px] [background:#fff7f7]" role="alert">{appError}</p>}
            <div className="pair-poster-grid [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:18px] max-[420px]:[grid-template-columns:1fr] max-[420px]:[gap:12px]">
              {pairPosterCandidates.map((candidate, index) => {
                const isSelected = candidate.id === selectedCandidate;
                const vision = candidate.vision?.trim() || "";
                const mission = candidate.mission?.trim() || "";
                return (
                  <button
                    className={`pair-poster-card motion-safe:animate-poster-in transition-[transform,border-color,box-shadow] duration-300 motion-reduce:animate-none motion-reduce:transform-none  [display:flex] [min-width:0] [overflow:hidden] [flex-direction:column] [padding:0] [border:1px_solid_#e9ebe4] [border-radius:12px] [background:#fff] [text-align:left] [box-shadow:0_5px_16px_rgba(32,_54,_43,_.04)] [transition:transform_.18s,_border-color_.18s,_box-shadow_.18s] [cursor:pointer] [&:hover]:[transform:translateY(-3px)] [&:hover]:[border-color:#d7a1a7] [&:hover]:[box-shadow:0_10px_22px_rgba(115,_49,_56,_.09)] [&.selected]:[border-color:#bd3548] [&.selected]:[box-shadow:0_0_0_2px_rgba(189,_53,_72,_.12)] [&_.mpk-poster-select]:[margin:auto_16px_15px] [&.selected_.mpk-poster-select]:[border-color:#bd3548] [&.selected_.mpk-poster-select]:[color:#fff] [&.selected_.mpk-poster-select]:[background:#bd3548]${isSelected ? "selected" : ""}`}
                    key={candidate.id}
                    style={{ animationDelay: `${index * 100}ms` }}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setSelectedCandidate(candidate.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="mpk-poster-card-top [display:flex] [align-items:center] [justify-content:space-between] [padding:10px_11px] [color:#9c7376] [font-size:7px] [font-weight:800] [letter-spacing:.7px] [&_strong]:[display:grid] [&_strong]:[width:23px] [&_strong]:[height:23px] [&_strong]:[place-items:center] [&_strong]:[border-radius:50%] [&_strong]:[color:#a93646] [&_strong]:[background:#fff0f1] [&_strong]:[font-size:9px] max-[420px]:[padding:8px] max-[420px]:[font-size:6px]">
                      <span>PASANGAN CALON {currentOrganization.name}</span>
                      <strong>{candidate.number}</strong>
                    </span>
                    <span className={`mpk-poster-portrait pair-poster-portrait  [position:relative] [display:grid] [height:152px] [margin:0_9px] [overflow:hidden] [place-items:center] [border-radius:7px] [background:linear-gradient(145deg,_color-mix(in_srgb,_currentColor_12%,_white),_color-mix(in_srgb,_currentColor_35%,_white))] [&::before]:[position:absolute] [&::before]:[width:125px] [&::before]:[height:125px] [&::before]:[border:1px_solid_rgba(255,255,255,.62)] [&::before]:[border-radius:50%] [&::before]:[content:''] [&::after]:[position:absolute] [&::after]:[width:170px] [&::after]:[height:170px] [&::after]:[border:1px_solid_rgba(255,255,255,.62)] [&::after]:[border-radius:50%] [&::after]:[content:''] [&::before]:[top:19px] [&::before]:[left:-61px] [&::after]:[right:-66px] [&::after]:[bottom:-72px] [&_svg]:[position:relative] [&_svg]:[z-index:1] [&_svg]:[width:100%] [&_svg]:[height:100%] [&_svg]:[padding:13px_10px_0] [&_.mpk-poster-photo]:[position:relative] [&_.mpk-poster-photo]:[z-index:1] [&_.mpk-poster-photo]:[width:100%] [&_.mpk-poster-photo]:[height:100%] [&_.mpk-poster-photo]:[object-fit:cover] max-[760px]:[height:155px] max-[420px]:[height:125px] max-[420px]:[margin:0_6px] [height:245px] [margin:0_12px] [color:#a93646] [background:linear-gradient(145deg,_#f8e9e9,_#f2e4d8)] max-[760px]:[height:205px] max-[420px]:[height:205px]${candidate.color}`}>
                      {candidate.photoDataUrl ? (
                        <Image
                          className="mpk-poster-photo"
                          src={candidate.photoDataUrl}
                          alt={`Foto pasangan ${candidate.name} dan ${candidate.viceName}`}
                          width={360}
                          height={240}
                          unoptimized
                        />
                      ) : (
                        <span className="pair-poster-initials [position:relative] [z-index:1] [color:#7d5056] [font:800_clamp(45px,_8vw,_75px)_'Manrope',_sans-serif] [letter-spacing:-5px]">{candidate.initials}</span>
                      )}
                      <span className="mpk-poster-photo-label [position:absolute] [right:7px] [bottom:7px] [z-index:2] [padding:4px_6px] [border-radius:4px] [color:#745a59] [background:rgba(255,255,255,.86)] [font-size:6px] [font-weight:800] [letter-spacing:.6px]">{candidate.photoDataUrl ? "FOTO" : "ILUSTRASI"}</span>
                    </span>
                    <span className="pair-poster-names [display:grid] [grid-template-columns:1fr_auto_1fr] [align-items:center] [gap:8px] [padding:17px_18px_0] [text-align:center] [&_>_span:not(.pair-poster-plus)]:[display:flex] [&_>_span:not(.pair-poster-plus)]:[min-width:0] [&_>_span:not(.pair-poster-plus)]:[flex-direction:column] [&_>_span:not(.pair-poster-plus)]:[gap:5px] [&_small]:[color:#a93646] [&_small]:[font-size:7px] [&_small]:[font-weight:800] [&_small]:[letter-spacing:.7px] [&_strong]:[color:#35473d] [&_strong]:[font:800_13px/1.35_'Manrope',_sans-serif] [&_strong]:[overflow-wrap:anywhere] max-[760px]:[padding:14px_12px_0] max-[420px]:[&_strong]:[font-size:12px]">
                      <span><small>CALON KETUA</small><strong>{candidate.name}</strong></span>
                      <span className="pair-poster-plus [color:#bd3548] [font:700_14px_'Manrope',_sans-serif]" aria-hidden="true">&amp;</span>
                      <span><small>CALON WAKIL</small><strong>{candidate.viceName}</strong></span>
                    </span>
                    <span className="pair-poster-profile [display:flex] [flex-direction:column] [padding:0_18px] [&_.mpk-poster-vision]:[min-height:36px] [&_.mpk-poster-vision]:[font-size:10px] [&_.mpk-poster-missions_>_span]:[font-size:9px] max-[420px]:[&_.mpk-poster-vision]:[font-size:9px] max-[420px]:[&_.mpk-poster-missions_>_span]:[font-size:8px] max-[760px]:[padding:0_12px]">
                      <span className="mpk-poster-copy-label [margin-top:9px] [color:#a93646] [font-size:7px] [font-weight:800] [letter-spacing:.65px] [text-transform:uppercase]">Visi{vision ? "" : " · Contoh"}</span>
                      <span className="mpk-poster-vision [margin-top:4px] [color:#657269] [font-size:8px] [line-height:1.5] max-[420px]:[font-size:7px]">{vision || candidate.program}</span>
                      <span className="mpk-poster-copy-label [margin-top:9px] [color:#a93646] [font-size:7px] [font-weight:800] [letter-spacing:.65px] [text-transform:uppercase]">Misi{mission ? "" : " · Contoh"}</span>
                      <span className="mpk-poster-missions [display:grid] [gap:4px] [margin-top:5px] [&_>_span]:[position:relative] [&_>_span]:[padding-left:10px] [&_>_span]:[color:#657269] [&_>_span]:[font-size:7px] [&_>_span]:[line-height:1.45] [&_>_span::before]:[position:absolute] [&_>_span::before]:[top:0] [&_>_span::before]:[left:0] [&_>_span::before]:[color:#bd3548] [&_>_span::before]:[content:'•'] max-[420px]:[&_>_span]:[font-size:6px]">
                        {(mission
                          ? mission.split(/\n+/).map((item) => item.trim()).filter(Boolean)
                          : [candidate.motto]
                        ).map((item) => <span key={item}>{item}</span>)}
                      </span>
                    </span>
                    <span className={`mpk-poster-select [display:block] [margin:11px_10px_10px] [padding:8px_5px] [border:1px_solid_#eee6e3] [border-radius:6px] [color:#738076] [font-size:8px] [font-weight:700] [text-align:center] max-[420px]:[margin-right:7px] max-[420px]:[margin-left:7px] ${isSelected ? "[border-color:#bd3548] [color:#fff] [background:#bd3548]" : ""}`}>
                      {isSelected ? "✓ Dipilih" : "Pilih paslon"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <>
        {appError && <p className="form-error app-error [margin:-7px_0_10px] [color:#b6473d] [font-size:10px] [width:fit-content] [margin:14px_0_0] [padding:9px_12px] [border:1px_solid_#f0d7d9] [border-radius:6px] [background:#fff7f7]" role="alert">{appError}</p>}
        <section className="welcome-strip motion-safe:animate-rise-in [display:flex] [align-items:center] [justify-content:space-between] [padding:34px_0_30px] [&_h1]:[margin:10px_0_4px] [&_h1]:[color:#1e342b] [&_h1]:[font:700_27px_'Manrope',_sans-serif] [&_h1]:[letter-spacing:-1px] [&_>_div:first-child_>_p]:[margin:0] [&_>_div:first-child_>_p]:[color:#7f8981] [&_>_div:first-child_>_p]:[font-size:11px] max-[760px]:[align-items:flex-start] max-[760px]:[gap:16px] max-[760px]:[padding:24px_0_20px] max-[760px]:[&_h1]:[font-size:23px] max-[760px]:[&_>_div:first-child_>_p]:[max-width:200px] max-[760px]:[&_>_div:first-child_>_p]:[font-size:9px] max-[760px]:[&_>_div:first-child_>_p]:[line-height:1.5] max-[420px]:[flex-direction:column]">
          <div>
            <span className="eyebrow dark-eyebrow [font-size:9px] [font-weight:700] [letter-spacing:1.15px] [color:#849177]"><span className="live-dot [width:7px] [height:7px] [display:inline-block] [flex:0_0_auto] [border-radius:50%] [background:#cbe67c] [box-shadow:0_0_0_3px_rgba(203,_230,_124,_.13)]" /> SAATNYA IKUT MENENTUKAN</span>
            <h1>Hai, {voter}! <span className="wave [color:#a4bc64] [font-size:18px]">✳</span></h1>
            <p>Pilih pemimpin yang paling mewakili harapanmu.</p>
          </div>
          <div className="progress-card motion-safe:animate-content-in [width:229px] [padding:13px_15px_12px] [border:1px_solid_#eceee8] [border-radius:9px] [background:#fff] max-[760px]:[width:172px] max-[760px]:[flex:0_0_auto] max-[760px]:[padding:11px] max-[420px]:[width:100%]" style={{ animationDelay: "120ms" }}>
            <div className="progress-copy [display:flex] [align-items:center] [justify-content:space-between] [color:#8b948b] [font-size:8px] [font-weight:700] [letter-spacing:.5px] [&_strong]:[color:#254637] [&_strong]:[font:700_18px_'Manrope',_sans-serif] [&_strong_small]:[color:#a1a99e] [&_strong_small]:[font-size:10px] max-[760px]:[font-size:7px]"><span>PROGRES PEMILIHAN</span><strong>{votedCount}<small>/{electionOrganizations.length}</small></strong></div>
            <div className="progress-track [height:4px] [margin-top:9px] [border-radius:4px] [background:#eef0e9] [overflow:hidden] [&_>_span]:[display:block] [&_>_span]:[height:100%] [&_>_span]:[border-radius:inherit] [&_>_span]:[background:#a8c269] [&_>_span]:[transition:width_.75s_cubic-bezier(.2,.8,.2,1)]"><span className="motion-reduce:transition-none" style={{ width: `${(votedCount / electionOrganizations.length) * 100}%` }} /></div>
            <span className="progress-caption [display:block] [margin-top:6px] [color:#9ba299] [font-size:8px] max-[760px]:[font-size:7px]">{allVoted ? "Semua pilihanmu sudah tercatat!" : `${electionOrganizations.length - votedCount} organisasi lagi untuk dipilih`}</span>
          </div>
        </section>

        <div className="voting-layout motion-safe:animate-content-in [display:grid] [grid-template-columns:263px_minmax(0,_1fr)] [min-height:470px] [border:1px_solid_#e9ebe4] [border-radius:12px] [overflow:hidden] [background:#fff] max-[760px]:[grid-template-columns:1fr]" style={{ animationDelay: "100ms" }}>
          <aside className="organization-sidebar [position:relative] [padding:24px_17px] [overflow:hidden] [border-right:1px_solid_#e9ebe4] [background:#fbfcf8] max-[760px]:[padding:15px_13px_13px] max-[760px]:[border-right:0] max-[760px]:[border-bottom:1px_solid_#e9ebe4] max-[420px]:[padding-right:9px] max-[420px]:[padding-left:9px]">
            <div className="section-label [margin:0_0_15px_5px] [color:#929b8d] [font-size:8px] [font-weight:700] [letter-spacing:1px] max-[760px]:[margin-bottom:10px]">PILIH ORGANISASI</div>
            <div className="organization-list [display:flex] [flex-direction:column] [gap:6px] max-[760px]:[flex-direction:row] max-[760px]:[gap:6px]">
              {electionOrganizations.map((organization, index) => {
                const isActive = activeOrganization === organization.id;
                const hasVoted = Boolean(votes[organization.id]);
                return (
                  <button
                    key={organization.id}
                    className={`organization-option  [width:100%] [min-height:59px] [display:flex] [align-items:center] [gap:10px] [padding:8px] [border:1px_solid_transparent] [border-radius:8px] [background:transparent] [text-align:left] [cursor:pointer] [transition:background_.2s,_border-color_.2s,_transform_.2s,_box-shadow_.2s] [&:hover]:[background:#f5f7ef] [&:active]:[transform:scale(.985)] [&.active]:[border-color:#e7ecdc] [&.active]:[background:#f1f5e9] max-[760px]:[min-width:0] max-[760px]:[flex:1] max-[760px]:[min-height:48px] max-[760px]:[gap:6px] max-[760px]:[padding:5px] max-[420px]:[flex-direction:column] max-[420px]:[gap:3px] max-[420px]:[justify-content:center]${isActive ? "active" : ""} transition-[transform,background-color,border-color] duration-200 hover:translate-x-1 active:scale-[.985] motion-reduce:transform-none`}
                    onClick={() => {
                      setActiveOrganization(organization.id);
                      setSelectedCandidate("");
                    }}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span className={`organization-icon  [width:34px] [height:34px] [flex:0_0_auto] [border-radius:9px] [display:grid] [place-items:center] [font:700_13px_'Manrope',_sans-serif] max-[760px]:[width:28px] max-[760px]:[height:28px] max-[760px]:[border-radius:7px] max-[760px]:[font-size:11px] max-[420px]:[width:25px] max-[420px]:[height:25px]${organization.color} ${isActive ? "motion-safe:animate-check-pop" : ""}`}>{organization.initials}</span>
                    <span className="organization-copy [min-width:0] [flex:1] [&_strong]:[display:block] [&_strong]:[color:#34483e] [&_strong]:[font-size:10px] [&_small]:[display:block] [&_small]:[max-width:145px] [&_small]:[margin-top:3px] [&_small]:[overflow:hidden] [&_small]:[color:#919990] [&_small]:[font-size:8px] [&_small]:[text-overflow:ellipsis] [&_small]:[white-space:nowrap] max-[760px]:[&_strong]:[font-size:9px] max-[760px]:[&_small]:[max-width:74px] max-[760px]:[&_small]:[font-size:7px] max-[420px]:[text-align:center] max-[420px]:[&_small]:[max-width:87px]"><strong>{organization.name}</strong><small>{organization.fullName}</small></span>
                    <span className={`organization-status  [width:23px] [height:23px] [border:1px_solid_#e9ece3] [border-radius:50%] [display:grid] [place-items:center] [color:#a2aaa0] [font-size:8px] [&.done]:[border-color:#dbe8c5] [&.done]:[color:#50713e] [&.done]:[background:#edf4df] [&.done]:[font-size:12px] max-[760px]:[display:none]${hasVoted ? "done" : ""}`}>{hasVoted ? "✓" : `0${index + 1}`}</span>
                  </button>
                );
              })}
            </div>
            <div className="sidebar-note [position:relative] [z-index:1] [margin-top:26px] [padding:14px_12px_13px] [border:1px_solid_#e9eddf] [border-radius:8px] [background:#f5f7ed] [&_>_strong]:[display:block] [&_>_strong]:[color:#536649] [&_>_strong]:[font-size:9px] [&_p]:[margin:6px_0_0] [&_p]:[color:#84907c] [&_p]:[font-size:8px] [&_p]:[line-height:1.65] max-[760px]:[display:none]">
              <span className="note-star [display:inline-grid] [width:21px] [height:21px] [margin-bottom:8px] [border-radius:7px] [place-items:center] [color:#68834a] [background:#e7edda] [font-size:12px]">✳</span>
              <strong>Ingat, ya!</strong>
              <p>Admin dapat melihat pilihan setiap siswa. Pilih dengan hati dan pikiran terbuka.</p>
            </div>
            <div className="sidebar-decoration [position:absolute] [right:6px] [bottom:-16px] [color:#e9eddf] [&_span:nth-child(1)]:[font-size:57px] [&_span:nth-child(2)]:[position:absolute] [&_span:nth-child(2)]:[top:-30px] [&_span:nth-child(2)]:[left:-35px] [&_span:nth-child(2)]:[font-size:29px] [&_span:nth-child(3)]:[position:absolute] [&_span:nth-child(3)]:[top:-10px] [&_span:nth-child(3)]:[left:-52px] [&_span:nth-child(3)]:[font-size:27px] max-[760px]:[display:none]" aria-hidden="true"><span>✳</span><span>✳</span><span>·</span></div>
          </aside>

          <section key={activeOrganization} className="candidate-section motion-safe:animate-content-in [padding:26px_26px_18px] min-[1200px]:[padding-right:29px] min-[1200px]:[padding-left:29px] max-[760px]:[padding:19px_15px_15px] max-[420px]:[padding-right:10px] max-[420px]:[padding-left:10px]">
            <div className="candidate-header [display:flex] [justify-content:space-between] [align-items:flex-start] [margin-bottom:19px] [&_h2]:[margin:7px_0_4px] [&_h2]:[color:#263b31] [&_h2]:[font:700_18px_'Manrope',_sans-serif] [&_h2]:[letter-spacing:-.5px] [&_p]:[margin:0] [&_p]:[color:#89928a] [&_p]:[font-size:9px] max-[760px]:[&_h2]:[font-size:16px] max-[760px]:[&_p]:[max-width:250px] max-[760px]:[&_p]:[line-height:1.5]">
              <div>
                <span className="eyebrow dark-eyebrow [font-size:9px] [font-weight:700] [letter-spacing:1.15px] [color:#849177]">KANDIDAT {currentOrganization.name}</span>
                <h2>{currentOrganization.fullName}</h2>
                <p>{currentOrganization.description}</p>
              </div>
              <span className="candidate-count [padding:5px_8px] [border:1px_solid_#eceee8] [border-radius:5px] [color:#55704d] [font:700_10px_'Manrope',_sans-serif] [&_span]:[margin-left:3px] [&_span]:[color:#929a90] [&_span]:[font:600_7px_'DM_Sans',_sans-serif] [&_span]:[letter-spacing:.7px]">
                {activeOrganization === "mpk" ? currentOrganization.candidates.length : "03"}
                <span>{activeOrganization === "mpk" ? "ANGGOTA MPK" : "PASLON"}</span>
              </span>
            </div>
            {votes[activeOrganization] ? (
              <div className="already-voted motion-safe:animate-content-in [min-height:295px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [text-align:center] [&_h3]:[margin:14px_0_6px] [&_h3]:[color:#33493c] [&_h3]:[font:700_16px_'Manrope',_sans-serif] [&_p]:[color:#89928a] [&_p]:[font-size:10px] max-[760px]:[min-height:240px]">
                <span className="success-icon motion-safe:animate-success-pop [width:44px] [height:44px] [border-radius:50%] [display:grid] [place-items:center] [color:#547840] [background:#e9f1dd] [font-size:21px]">✓</span>
                <h3>Suaramu untuk {currentOrganization.name} sudah tercatat!</h3>
                <p>Terima kasih sudah ikut menentukan masa depan sekolah kita.</p>
                {votedCount < electionOrganizations.length && (
                  <button className="text-button [margin-top:10px] [padding:7px_0] [border:0] [color:#537348] [background:transparent] [font-size:10px] [font-weight:700] [cursor:pointer] [&_span]:[margin-left:5px] [&_span]:[font-size:14px]" onClick={() => {
                    const next = electionOrganizations.find((organization) => !votes[organization.id]);
                    if (next) setActiveOrganization(next.id);
                  }}>Pilih organisasi berikutnya <span>→</span></button>
                )}
              </div>
            ) : (
              activeOrganization === "mpk" ? (
                <>
                  <p className="mpk-vote-instructions [margin:0_0_16px] [color:#818a83] [font-size:10px] [line-height:1.6]">
                    Pilih satu anggota untuk setiap jabatan. Anggota yang sama boleh dipilih untuk kedua jabatan.
                  </p>
                  <div className="mpk-position-grid [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:14px] max-[760px]:[grid-template-columns:1fr]">
                    {(["chair", "vice"] as const).map((position) => {
                      const savedMemberId = mpkSelections[position];
                      const positionCandidates =
                        electionCandidates?.mpkMembers[position] ?? [];
                      const title =
                        position === "chair" ? "Calon Ketua MPK" : "Calon Wakil Ketua MPK";
                      return (
                        <section className="mpk-position-card [min-width:0] [padding:14px] [border:1px_solid_#e9ebe4] [border-radius:9px] [background:#fff]" key={position}>
                          <div className="mpk-position-heading [display:flex] [flex-wrap:wrap] [align-items:center] [justify-content:space-between] [gap:7px] [padding-bottom:10px] [border-bottom:1px_solid_#f0f0eb] [&_h3]:[margin:0] [&_h3]:[color:#34483e] [&_h3]:[font-size:11px] [&_>_span]:[color:#929a91] [&_>_span]:[font-size:8px] [&_.mpk-choice-saved]:[color:#4a693c] [&_.mpk-choice-saved]:[font-weight:700]">
                            <h3>{title}</h3>
                            {savedMemberId ? (
                              <span className="mpk-choice-saved">Pilihan tercatat</span>
                            ) : (
                              <span>Belum memilih</span>
                            )}
                          </div>
                          {savedMemberId && (
                            <p className="mpk-selected-member [margin:10px_0_0] [color:#a93646] [font-size:10px] [font-weight:700]">
                              {positionCandidates.find((candidate) => candidate.id === savedMemberId)
                                ?.name ?? "Anggota MPK"}
                            </p>
                          )}
                          {!savedMemberId && (
                            <div className="mpk-member-list [display:grid] [gap:7px] [margin-top:11px]">
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
                                className={`mpk-member-option motion-safe:animate-poster-in transition-[transform,box-shadow,border-color] duration-200 motion-reduce:animate-none motion-reduce:transform-none  [display:flex] [align-items:center] [gap:9px] [min-height:46px] [padding:6px_9px] [border:1px_solid_#e9ebe4] [border-radius:7px] [background:#fff] [text-align:left] [cursor:pointer] [&:hover:not(:disabled)]:[border-color:#c94d5b] [&:hover:not(:disabled)]:[background:#fff8f8] [&.selected]:[border-color:#c94d5b] [&.selected]:[background:#fff8f8] [&:disabled]:[cursor:not-allowed] [&:disabled]:[opacity:.66] [&_strong]:[min-width:0] [&_strong]:[flex:1] [&_strong]:[color:#46564b] [&_strong]:[font-size:9px]${
                                  selectedCandidate === candidate.id &&
                                  selectedMpkPosition === position
                                    ? "selected"
                                    : ""
                                }`}
                                style={{ animationDelay: `${Math.min(index, 7) * 55}ms` }}
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
                                <span className={`mpk-member-avatar  [width:30px] [height:30px] [flex:0_0_auto] [display:grid] [place-items:center] [border-radius:50%] [color:#495448] [font-size:8px] [font-weight:700] [&.rose]:[background:#f1d8d8] [&.blue]:[background:#dce5f1] [&.yellow]:[background:#f0e9c9] [&.mint]:[background:#dbece2] [&.peach]:[background:#f2dfd3] [&.lilac]:[background:#e8def1]${colors[index % colors.length]}`}>
                                  {initials}
                                </span>
                                <strong>{candidate.name}</strong>
                                <span className="mpk-member-check [width:19px] [color:#a93646] [font-size:14px] [text-align:center]">
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
                  <div className="voting-action [display:flex] [align-items:center] [justify-content:space-between] [gap:12px] [margin-top:17px] [&_>_span]:[color:#929a92] [&_>_span]:[font-size:8px] max-[760px]:[align-items:flex-end] max-[760px]:[&_>_span]:[max-width:165px] max-[760px]:[&_>_span]:[font-size:7px] max-[760px]:[&_>_span]:[line-height:1.5] max-[420px]:[&_>_span]:[max-width:130px]">
                    <span><span className="small-lock [margin-right:5px] [color:#94a378] [font-size:9px]">▣</span> Setiap pilihan jabatan hanya bisa dikirim satu kali.</span>
                    <button
                      className="primary-button vote-button [height:44px] [border:0] [border-radius:7px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:14px] [color:#f9faef] [background:#17483b] [font-size:10px] [font-weight:700] [cursor:pointer] [transition:background_.2s,_transform_.2s,_box-shadow_.2s,_opacity_.2s] [&:hover:not(:disabled)]:[background:#225d4b] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:active:not(:disabled)]:[transform:translateY(0)_scale(.98)] [&:disabled]:[cursor:wait] [&:focus-visible]:[outline:3px_solid_#b5cd79] [&:focus-visible]:[outline-offset:3px] [&_span]:[font-size:15px] [&_span]:[font-weight:400] [height:37px] [padding:0_13px] [font-size:9px] [&:disabled]:[color:#a0a69d] [&:disabled]:[background:#eef0ea] [&:disabled]:[cursor:not-allowed] max-[760px]:[height:35px] max-[760px]:[padding:0_9px] max-[760px]:[font-size:8px]"
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
                  <div className="candidate-grid [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:10px] max-[760px]:[gap:8px] max-[420px]:[gap:5px]">
                    {currentOrganization.candidates.map((candidate, index) => (
                      <button
                        key={candidate.id}
                        className={`candidate-card transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 motion-safe:animate-fade-in motion-reduce:animate-none motion-reduce:transform-none  [position:relative] [min-width:0] [padding:11px_10px_10px] [border:1px_solid_#ebede7] [border-radius:8px] [background:#fff] [text-align:left] [cursor:pointer] [transition:transform_.24s_cubic-bezier(.2,.8,.2,1),_border-color_.2s,_box-shadow_.2s] [&:hover]:[border-color:#ccd9b6] [&:hover]:[box-shadow:0_5px_15px_rgba(39,_68,_46,_.06)] [&.selected]:[border-color:#819e60] [&.selected]:[box-shadow:0_0_0_2px_rgba(129,_158,_96,_.14)] [&.selected_.select-indicator]:[border-color:#668549] [&.selected_.select-indicator]:[background:#668549] max-[760px]:[padding:8px_7px_9px] max-[420px]:[padding-right:5px] max-[420px]:[padding-left:5px]${selectedCandidate === candidate.id ? "selected" : ""}`}
                        style={{ animationDelay: `${index * 80}ms` }}
                      onClick={() => setSelectedCandidate(candidate.id)}
                        aria-pressed={selectedCandidate === candidate.id}
                      >
                        <span className="candidate-number [display:flex] [align-items:center] [justify-content:space-between] [color:#9aa197] [font-size:7px] [font-weight:700] [letter-spacing:.7px] [&_strong]:[width:20px] [&_strong]:[height:20px] [&_strong]:[border-radius:50%] [&_strong]:[display:grid] [&_strong]:[place-items:center] [&_strong]:[color:#627650] [&_strong]:[background:#f0f3e8] [&_strong]:[font-size:8px] [&_strong]:[letter-spacing:0] max-[420px]:[font-size:6px]">PASLON <strong>{candidate.number}</strong></span>
                        <span className={`candidate-photo  [height:139px] [position:relative] [display:flex] [align-items:center] [justify-content:center] [margin:10px_0_11px] [overflow:hidden] [border-radius:6px] [&::before]:[content:''] [&::before]:[position:absolute] [&::before]:[width:116px] [&::before]:[height:116px] [&::before]:[right:-22px] [&::before]:[bottom:-57px] [&::before]:[border:1px_solid_rgba(255,255,255,.58)] [&::before]:[border-radius:50%] [&::before]:[box-shadow:0_0_0_10px_rgba(255,255,255,.12),_0_0_0_22px_rgba(255,255,255,.1)] [&.rose]:[background:linear-gradient(145deg,_#f8e9e6,_#ebc7c7)] [&.blue]:[background:linear-gradient(145deg,_#e5eff0,_#b9d1da)] [&.yellow]:[background:linear-gradient(145deg,_#f6f0d8,_#e6d9aa)] [&.mint]:[background:linear-gradient(145deg,_#e1eee0,_#bad7bf)] [&.peach]:[background:linear-gradient(145deg,_#f8ebe0,_#e9c5ac)] [&.lilac]:[background:linear-gradient(145deg,_#eee8f5,_#cfc0e2)] max-[760px]:[height:125px] max-[420px]:[height:103px]${candidate.color}`}>
                          {candidate.photoDataUrl ? (
                            <Image
                              className="candidate-photo-image [position:absolute] [inset:0] [z-index:1] [width:100%] [height:100%] [object-fit:cover]"
                              src={candidate.photoDataUrl}
                              alt={`Foto pasangan ${candidate.name} dan ${candidate.viceName}`}
                              width={320}
                              height={240}
                              unoptimized
                            />
                          ) : (
                            <>
                              <span className="portrait-initials [width:75px] [height:75px] [position:relative] [z-index:1] [border:4px_solid_rgba(255,255,255,.63)] [border-radius:50%] [display:grid] [place-items:center] [color:rgba(39,_65,_53,_.78)] [background:rgba(255,255,255,.3)] [font:700_19px_'Manrope',_sans-serif] [letter-spacing:-1px]">{candidate.initials}</span>
                              <span className="candidate-photo-label [position:absolute] [z-index:2] [right:7px] [bottom:7px] [padding:4px_6px] [border-radius:4px] [color:#745a59] [background:rgba(255,255,255,.86)] [font-size:6px] [font-weight:800] [letter-spacing:.6px]">ILUSTRASI</span>
                            </>
                          )}
                          <span className="photo-spark motion-safe:animate-float [position:absolute] [z-index:2] [top:14px] [right:15px] [color:rgba(255,255,255,.8)] [font-size:18px]">✳</span>
                          <span className="photo-orbit [position:absolute] [width:115px] [height:115px] [border:1px_solid_rgba(255,255,255,.55)] [border-radius:50%]" />
                        </span>
                        <span className="candidate-info [min-height:101px] [display:flex] [flex-direction:column] max-[420px]:[min-height:105px] [&_.candidate-name]:[margin-top:2px] max-[760px]:[min-height:0]">
                          <span className="candidate-role [color:#a17d80] [font-size:7px] [font-weight:700] [letter-spacing:.35px] [text-transform:uppercase]">Calon ketua</span>
                          <strong className="candidate-name [color:#30453b] [font:700_12px_'Manrope',_sans-serif] [letter-spacing:-.3px] max-[760px]:[font-size:10px] max-[420px]:[font-size:9px]">{candidate.name}</strong>
                          <span className="candidate-class [margin-top:3px] [color:#929a91] [font-size:8px]">{candidate.className}</span>
                          <span className="candidate-vice-divider [width:100%] [height:1px] [margin:6px_0] [background:#f0eeea]" />
                          <span className="candidate-role [color:#a17d80] [font-size:7px] [font-weight:700] [letter-spacing:.35px] [text-transform:uppercase]">Calon wakil ketua</span>
                          <strong className="candidate-vice-name [margin-top:2px] [color:#62484a] [font:700_10px_'Manrope',_sans-serif] [letter-spacing:-.2px]">{candidate.viceName}</strong>
                          <span className="candidate-program [display:-webkit-box] [min-height:35px] [margin-top:10px] [overflow:hidden] [color:#78837a] [font-size:8px] [line-height:1.6] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] [&_small]:[display:block] [&_small]:[margin-bottom:3px] [&_small]:[color:#a93646] [&_small]:[font-size:7px] [&_small]:[font-style:normal] [&_small]:[font-weight:800] [&_small]:[letter-spacing:.5px] [&_small]:[text-transform:uppercase] max-[760px]:[font-size:7px] max-[420px]:[font-size:6px]">
                            <small>Visi{candidate.vision ? "" : " · Contoh"}</small>
                            {candidate.vision || candidate.program}
                          </span>
                        </span>
                        <span className="candidate-motto [&_small]:[display:block] [&_small]:[margin-bottom:3px] [&_small]:[color:#a93646] [&_small]:[font-size:7px] [&_small]:[font-style:normal] [&_small]:[font-weight:800] [&_small]:[letter-spacing:.5px] [&_small]:[text-transform:uppercase] [display:block] [min-height:38px] [margin-top:8px] [padding:7px_6px] [border-radius:4px] [color:#677b5a] [background:#f5f7ef] [font-size:7px] [font-style:normal] [line-height:1.5] [white-space:pre-line] max-[760px]:[font-size:6px]">
                          <small>Misi{candidate.mission ? "" : " · Contoh"}</small>
                          {candidate.mission || candidate.motto}
                        </span>
                        <span className={`select-indicator  [position:absolute] [right:9px] [bottom:9px] [width:16px] [height:16px] [border:1px_solid_#dfe5d6] [border-radius:50%] [display:grid] [place-items:center] [color:#fff] [background:#fff] [font-size:9px]${selectedCandidate === candidate.id ? "motion-safe:animate-check-pop" : ""}`}>{selectedCandidate === candidate.id ? "✓" : ""}</span>
                      </button>
                    ))}
                  </div>
                  <div className="voting-action [display:flex] [align-items:center] [justify-content:space-between] [gap:12px] [margin-top:17px] [&_>_span]:[color:#929a92] [&_>_span]:[font-size:8px] max-[760px]:[align-items:flex-end] max-[760px]:[&_>_span]:[max-width:165px] max-[760px]:[&_>_span]:[font-size:7px] max-[760px]:[&_>_span]:[line-height:1.5] max-[420px]:[&_>_span]:[max-width:130px]">
                    <span><span className="small-lock [margin-right:5px] [color:#94a378] [font-size:9px]">▣</span> Pilihanmu tercatat dan tidak dapat diubah.</span>
                    <button
                      className="primary-button vote-button transition-transform duration-200 hover:-translate-y-0.5 active:scale-[.98] motion-reduce:transform-none [height:44px] [border:0] [border-radius:7px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:14px] [color:#f9faef] [background:#17483b] [font-size:10px] [font-weight:700] [cursor:pointer] [transition:background_.2s,_transform_.2s,_box-shadow_.2s,_opacity_.2s] [&:hover:not(:disabled)]:[background:#225d4b] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:active:not(:disabled)]:[transform:translateY(0)_scale(.98)] [&:disabled]:[cursor:wait] [&:focus-visible]:[outline:3px_solid_#b5cd79] [&:focus-visible]:[outline-offset:3px] [&_span]:[font-size:15px] [&_span]:[font-weight:400] [height:37px] [padding:0_13px] [font-size:9px] [&:disabled]:[color:#a0a69d] [&:disabled]:[background:#eef0ea] [&:disabled]:[cursor:not-allowed] max-[760px]:[height:35px] max-[760px]:[padding:0_9px] max-[760px]:[font-size:8px]"
                      disabled={!selectedCandidate}
                      onClick={() => setShowConfirmation(true)}
                    >{selectedCandidate ? "Lanjutkan pilihan" : "Pilih kandidat dulu"} <span>→</span></button>
                  </div>
                </>
              )
            )}
          </section>
        </div>
        <footer className="app-footer [display:flex] [justify-content:space-between] [padding:15px_2px_0] [color:#9ca39b] [font-size:8px] [letter-spacing:.35px] max-[760px]:[gap:12px] max-[760px]:[font-size:7px] max-[420px]:[font-size:6px]"><span>© 2026 SUARA MANDARA</span><span>Satu siswa, satu suara, satu perubahan. <span className="heart [color:#d48072]">♥</span></span></footer>
        <p className="demo-footer-note [margin:8px_0_20px] [color:#a7ada5] [font-size:8px] [text-align:right] max-[760px]:[font-size:7px]">Suara disimpan di database SQLite pada server sekolah.</p>
          </>
        )}
      </div>

      {isMpkPoster && (
        <div className="mpk-poster-action-bar [position:fixed] [z-index:8] [right:0] [bottom:0] [left:0] [display:flex] [align-items:center] [justify-content:space-between] [gap:20px] [min-height:83px] [padding:13px_max(calc((100vw_-_1060px)_/_2),_32px)] [border-top:1px_solid_#eee4e3] [background:rgba(255,255,255,.97)] [box-shadow:0_-7px_25px_rgba(36,_45,_37,_.07)] [backdrop-filter:blur(12px)] max-[760px]:[min-height:76px] max-[760px]:[gap:10px] max-[760px]:[padding:10px_18px] max-[420px]:[align-items:stretch] max-[420px]:[flex-direction:column] max-[420px]:[gap:7px] max-[420px]:[padding:9px_13px]">
          <div className="mpk-poster-action-copy [display:flex] [min-width:0] [flex-direction:column] [gap:4px] [&_strong]:[overflow:hidden] [&_strong]:[color:#35473d] [&_strong]:[font:800_12px_'Manrope',_sans-serif] [&_strong]:[text-overflow:ellipsis] [&_strong]:[white-space:nowrap] [&_span]:[color:#8b948b] [&_span]:[font-size:8px] max-[420px]:[display:none]">
            <strong>{selectedCandidateDetails?.name ?? `Pilih calon ${mpkPosterPositionLabel} MPK`}</strong>
            <span>{selectedCandidateDetails ? "Periksa pilihan sebelum mengirim suara." : "Pilih satu calon yang terdaftar untuk melanjutkan."}</span>
          </div>
          <button
            className="primary-button mpk-poster-action-button [height:44px] [border:0] [border-radius:7px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:14px] [color:#f9faef] [background:#17483b] [font-size:10px] [font-weight:700] [cursor:pointer] [transition:background_.2s,_transform_.2s,_box-shadow_.2s,_opacity_.2s] [&:hover:not(:disabled)]:[background:#225d4b] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:active:not(:disabled)]:[transform:translateY(0)_scale(.98)] [&:disabled]:[cursor:wait] [&:focus-visible]:[outline:3px_solid_#b5cd79] [&:focus-visible]:[outline-offset:3px] [&_span]:[font-size:15px] [&_span]:[font-weight:400] [min-width:220px] [padding:0_17px] [background:#c93246] [&:hover:not(:disabled)]:[background:#ad293b] [&:disabled]:[opacity:.58] [&:disabled]:[cursor:not-allowed] max-[760px]:[min-width:0] max-[760px]:[min-height:43px] max-[760px]:[padding:0_12px] max-[760px]:[font-size:9px] max-[420px]:[width:100%]"
            type="button"
            disabled={!selectedCandidateDetails || isSubmitting}
            onClick={() => setShowConfirmation(true)}
          >
            {mpkPosterPosition === "chair" ? "Pilih calon ketua & lanjutkan" : "Pilih calon wakil & lanjutkan"} <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {isElectionCompletedScreen && (
        <div className="mpk-poster-action-bar completion-action-bar [position:fixed] [z-index:8] [right:0] [bottom:0] [left:0] [display:flex] [align-items:center] [justify-content:space-between] [gap:20px] [min-height:83px] [padding:13px_max(calc((100vw_-_1060px)_/_2),_32px)] [border-top:1px_solid_#eee4e3] [background:rgba(255,255,255,.97)] [box-shadow:0_-7px_25px_rgba(36,_45,_37,_.07)] [backdrop-filter:blur(12px)] max-[760px]:[min-height:76px] max-[760px]:[gap:10px] max-[760px]:[padding:10px_18px] max-[420px]:[align-items:stretch] max-[420px]:[flex-direction:column] max-[420px]:[gap:7px] max-[420px]:[padding:9px_13px] [&_.mpk-poster-action-button]:[background:#c93246] [&_.mpk-poster-action-button:hover:not(:disabled)]:[background:#ad293b]">
          <div className="mpk-poster-action-copy [display:flex] [min-width:0] [flex-direction:column] [gap:4px] [&_strong]:[overflow:hidden] [&_strong]:[color:#35473d] [&_strong]:[font:800_12px_'Manrope',_sans-serif] [&_strong]:[text-overflow:ellipsis] [&_strong]:[white-space:nowrap] [&_span]:[color:#8b948b] [&_span]:[font-size:8px] max-[420px]:[display:none]">
            <strong>{nextUnvotedOrganization ? `Lanjut memilih ${nextUnvotedOrganization.name}` : "Semua pilihan sudah tercatat"}</strong>
            <span>{nextUnvotedOrganization ? "Pilih pasangan calon organisasi berikutnya." : "Terima kasih telah menggunakan hak pilihmu."}</span>
          </div>
          {nextUnvotedOrganization && (
            <button
              className="primary-button mpk-poster-action-button [height:44px] [border:0] [border-radius:7px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:14px] [color:#f9faef] [background:#17483b] [font-size:10px] [font-weight:700] [cursor:pointer] [transition:background_.2s,_transform_.2s,_box-shadow_.2s,_opacity_.2s] [&:hover:not(:disabled)]:[background:#225d4b] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:active:not(:disabled)]:[transform:translateY(0)_scale(.98)] [&:disabled]:[cursor:wait] [&:focus-visible]:[outline:3px_solid_#b5cd79] [&:focus-visible]:[outline-offset:3px] [&_span]:[font-size:15px] [&_span]:[font-weight:400] [min-width:220px] [padding:0_17px] [background:#c93246] [&:hover:not(:disabled)]:[background:#ad293b] [&:disabled]:[opacity:.58] [&:disabled]:[cursor:not-allowed] max-[760px]:[min-width:0] max-[760px]:[min-height:43px] max-[760px]:[padding:0_12px] max-[760px]:[font-size:9px] max-[420px]:[width:100%]"
              type="button"
              onClick={() => {
                setActiveOrganization(nextUnvotedOrganization.id);
                setSelectedCandidate("");
                setAppError("");
              }}
            >
              Lanjut memilih {nextUnvotedOrganization.name} <span aria-hidden="true">→</span>
            </button>
          )}
          {!nextUnvotedOrganization && (
            <button
              className="primary-button mpk-poster-action-button [height:44px] [border:0] [border-radius:7px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:14px] [color:#f9faef] [background:#17483b] [font-size:10px] [font-weight:700] [cursor:pointer] [transition:background_.2s,_transform_.2s,_box-shadow_.2s,_opacity_.2s] [&:hover:not(:disabled)]:[background:#225d4b] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:active:not(:disabled)]:[transform:translateY(0)_scale(.98)] [&:disabled]:[cursor:wait] [&:focus-visible]:[outline:3px_solid_#b5cd79] [&:focus-visible]:[outline-offset:3px] [&_span]:[font-size:15px] [&_span]:[font-weight:400] [min-width:220px] [padding:0_17px] [background:#c93246] [&:hover:not(:disabled)]:[background:#ad293b] [&:disabled]:[opacity:.58] [&:disabled]:[cursor:not-allowed] max-[760px]:[min-width:0] max-[760px]:[min-height:43px] max-[760px]:[padding:0_12px] max-[760px]:[font-size:9px] max-[420px]:[width:100%]"
              type="button"
              onClick={() => {
                void handleLogout().catch((error: unknown) => {
                  setAppError(error instanceof Error ? error.message : "Gagal kembali ke menu awal.");
                });
              }}
            >
              Kembali ke menu awal <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>
      )}

      {isPairPoster && (
        <div className="mpk-poster-action-bar pair-poster-action-bar [position:fixed] [z-index:8] [right:0] [bottom:0] [left:0] [display:flex] [align-items:center] [justify-content:space-between] [gap:20px] [min-height:83px] [padding:13px_max(calc((100vw_-_1060px)_/_2),_32px)] [border-top:1px_solid_#eee4e3] [background:rgba(255,255,255,.97)] [box-shadow:0_-7px_25px_rgba(36,_45,_37,_.07)] [backdrop-filter:blur(12px)] max-[760px]:[min-height:76px] max-[760px]:[gap:10px] max-[760px]:[padding:10px_18px] max-[420px]:[align-items:stretch] max-[420px]:[flex-direction:column] max-[420px]:[gap:7px] max-[420px]:[padding:9px_13px]">
          <div className="mpk-poster-action-copy [display:flex] [min-width:0] [flex-direction:column] [gap:4px] [&_strong]:[overflow:hidden] [&_strong]:[color:#35473d] [&_strong]:[font:800_12px_'Manrope',_sans-serif] [&_strong]:[text-overflow:ellipsis] [&_strong]:[white-space:nowrap] [&_span]:[color:#8b948b] [&_span]:[font-size:8px] max-[420px]:[display:none]">
            <strong>
              {selectedCandidateDetails
                ? `${selectedCandidateDetails.name} & ${selectedCandidateDetails.viceName}`
                : `Pilih satu paslon ${currentOrganization.name}`}
            </strong>
            <span>{selectedCandidateDetails ? "Periksa pilihan sebelum mengirim suara." : "Pilih paslon untuk melanjutkan."}</span>
          </div>
          <button
            className="primary-button mpk-poster-action-button [height:44px] [border:0] [border-radius:7px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:14px] [color:#f9faef] [background:#17483b] [font-size:10px] [font-weight:700] [cursor:pointer] [transition:background_.2s,_transform_.2s,_box-shadow_.2s,_opacity_.2s] [&:hover:not(:disabled)]:[background:#225d4b] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:active:not(:disabled)]:[transform:translateY(0)_scale(.98)] [&:disabled]:[cursor:wait] [&:focus-visible]:[outline:3px_solid_#b5cd79] [&:focus-visible]:[outline-offset:3px] [&_span]:[font-size:15px] [&_span]:[font-weight:400] [min-width:220px] [padding:0_17px] [background:#c93246] [&:hover:not(:disabled)]:[background:#ad293b] [&:disabled]:[opacity:.58] [&:disabled]:[cursor:not-allowed] max-[760px]:[min-width:0] max-[760px]:[min-height:43px] max-[760px]:[padding:0_12px] max-[760px]:[font-size:9px] max-[420px]:[width:100%]"
            type="button"
            disabled={!selectedCandidateDetails || isSubmitting}
            onClick={() => setShowConfirmation(true)}
          >
            {selectedCandidateDetails ? "Pilih paslon ini" : "Pilih paslon dulu"} <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {showConfirmation && selectedCandidateDetails && (
        <div className="modal-backdrop motion-safe:animate-backdrop-in [position:fixed] [z-index:10] [inset:0] [display:grid] [place-items:center] [padding:20px] [background:rgba(72,_30,_37,_.5)] [backdrop-filter:blur(3px)]" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowConfirmation(false);
        }}>
          <section className="confirmation-modal motion-safe:animate-modal-in [width:min(420px,_100%)] [position:relative] [padding:31px] [border-radius:13px] [background:#fff] [box-shadow:0_20px_65px_rgba(81,_35,_40,_.2)] [text-align:center] [&_h2]:[margin:9px_0_9px] [&_h2]:[color:#432d31] [&_h2]:[font:700_20px_'Manrope',_sans-serif] [&_h2]:[letter-spacing:-.7px] [&_>_p]:[max-width:320px] [&_>_p]:[margin:0_auto] [&_>_p]:[color:#79847b] [&_>_p]:[font-size:10px] [&_>_p]:[line-height:1.7] [&_>_p_strong]:[color:#a93646] [border:1px_solid_#f1dfdf] [&_.modal-candidate-avatar]:[color:#a93646] [&_.modal-candidate-avatar]:[background:#fff0f1] [&_.modal-close]:[color:#9c6f74] [&_.modal-close]:[background:#fff4f4] [&_.modal-actions_.primary-button]:[background:linear-gradient(110deg,_#d84c5c,_#bd3548)] [&_.modal-actions_.primary-button:hover:not(:disabled)]:[background:#ad293b] [&_.modal-actions_.primary-button:focus-visible]:[outline-color:#e7a0a7] [&_.secondary-button]:[border-color:#f0dfe0] [&_.secondary-button]:[color:#80585d] [&_.secondary-button:hover]:[border-color:#d98b94] [&_.secondary-button:hover]:[background:#fff8f8]" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <button className="modal-close [position:absolute] [top:12px] [right:14px] [width:27px] [height:27px] [border:0] [border-radius:50%] [color:#8f9990] [background:#f5f6f2] [font-size:18px] [cursor:pointer]" onClick={() => setShowConfirmation(false)} aria-label="Tutup">×</button>
            <span className={`modal-candidate-avatar  [width:54px] [height:54px] [display:grid] [place-items:center] [margin:0_auto_15px] [border-radius:50%] [font:700_16px_'Manrope',_sans-serif]${selectedCandidateDetails.color}`}>{selectedCandidateDetails.initials}</span>
            <span className="eyebrow dark-eyebrow [font-size:9px] [font-weight:700] [letter-spacing:1.15px] [color:#849177]">KONFIRMASI PILIHAN</span>
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
            <div className="modal-actions [display:grid] [grid-template-columns:1fr_1fr] [gap:9px] [margin-top:22px] [&_button:disabled]:[opacity:.65] [&_button:disabled]:[cursor:wait]">
              <button className="secondary-button [&:focus-visible]:[outline:3px_solid_#b5cd79] [&:focus-visible]:[outline-offset:3px] [height:42px] [border:1px_solid_#e4e8df] [border-radius:7px] [color:#536454] [background:#fff] [font-size:10px] [font-weight:600] [cursor:pointer]" onClick={() => setShowConfirmation(false)}>Lihat lagi</button>
              <button className="primary-button [height:44px] [border:0] [border-radius:7px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:14px] [color:#f9faef] [background:#17483b] [font-size:10px] [font-weight:700] [cursor:pointer] [transition:background_.2s,_transform_.2s,_box-shadow_.2s,_opacity_.2s] [&:hover:not(:disabled)]:[background:#225d4b] [&:hover:not(:disabled)]:[transform:translateY(-1px)] [&:active:not(:disabled)]:[transform:translateY(0)_scale(.98)] [&:disabled]:[cursor:wait] [&:focus-visible]:[outline:3px_solid_#b5cd79] [&:focus-visible]:[outline-offset:3px] [&_span]:[font-size:15px] [&_span]:[font-weight:400]" onClick={submitVote} disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Ya, kirim suara"} {isSubmitting ? (
                  <span className="button-spinner motion-safe:animate-spin [width:13px] [height:13px] [flex:0_0_auto] [border:2px_solid_rgba(255,255,255,.4)] [border-top-color:currentColor] [border-radius:50%]" aria-hidden="true" />
                ) : (
                  <span aria-hidden="true">→</span>
                )}
              </button>
            </div>
            <span className="demo-modal-note [display:block] [margin-top:13px] [color:#a1a79f] [font-size:8px]">Suara disimpan dengan aman dan tidak dapat diubah.</span>
          </section>
        </div>
      )}
    </main>
  );
}
