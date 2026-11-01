export const organizationIds = ["mpk", "osis", "ky"] as const;

export type OrganizationId = (typeof organizationIds)[number];

export const candidateIds: Record<OrganizationId, readonly string[]> = {
  mpk: ["mpk-1", "mpk-2", "mpk-3"],
  osis: ["osis-1", "osis-2", "osis-3"],
  ky: ["ky-1", "ky-2", "ky-3"],
};

export const candidateNames: Record<string, string> = {
  "mpk-1": "Nadia Putri",
  "mpk-2": "Raka Pratama",
  "mpk-3": "Salsabila A.",
  "osis-1": "Dimas Saputra",
  "osis-2": "Alya Maharani",
  "osis-3": "Fajar Ramadhan",
  "ky-1": "Keisha Anindya",
  "ky-2": "Bagas Wicaksono",
  "ky-3": "Intan Permata",
};
