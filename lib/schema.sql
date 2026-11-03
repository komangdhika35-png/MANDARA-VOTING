PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS voters (
  nis TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS voter_ids (
  identifier TEXT PRIMARY KEY NOT NULL,
  nis TEXT NOT NULL REFERENCES voters(nis) ON DELETE CASCADE
);

INSERT OR IGNORE INTO voter_ids (identifier, nis)
SELECT nis, nis FROM voters;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  nis TEXT NOT NULL REFERENCES voters(nis) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_sessions_expires_at ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS participation (
  nis TEXT NOT NULL REFERENCES voters(nis),
  organization_id TEXT NOT NULL CHECK (organization_id IN ('mpk', 'osis', 'ky')),
  voted_at INTEGER NOT NULL,
  PRIMARY KEY (nis, organization_id)
);

CREATE TABLE IF NOT EXISTS voter_choices (
  nis TEXT NOT NULL REFERENCES voters(nis),
  organization_id TEXT NOT NULL CHECK (organization_id IN ('mpk', 'osis', 'ky')),
  candidate_id TEXT NOT NULL,
  voted_at INTEGER NOT NULL,
  PRIMARY KEY (nis, organization_id)
);

CREATE TABLE IF NOT EXISTS ballots (
  ballot_id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL CHECK (organization_id IN ('mpk', 'osis', 'ky')),
  candidate_id TEXT NOT NULL,
  cast_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS ballots_organization ON ballots(organization_id);

CREATE TABLE IF NOT EXISTS election_candidates (
  candidate_id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL CHECK (organization_id IN ('mpk', 'osis', 'ky')),
  candidate_number TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  vice_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS election_candidate_details (
  candidate_id TEXT PRIMARY KEY NOT NULL REFERENCES election_candidates(candidate_id) ON DELETE CASCADE,
  photo_data_url TEXT NOT NULL DEFAULT '',
  vision TEXT NOT NULL DEFAULT '',
  mission TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS mpk_members (
  member_id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mpk_member_details (
  member_id TEXT PRIMARY KEY NOT NULL REFERENCES mpk_members(member_id) ON DELETE CASCADE,
  photo_data_url TEXT NOT NULL DEFAULT '',
  vision TEXT NOT NULL DEFAULT '',
  mission TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS mpk_member_positions (
  member_id TEXT NOT NULL REFERENCES mpk_members(member_id) ON DELETE CASCADE,
  position TEXT NOT NULL CHECK (position IN ('chair', 'vice')),
  PRIMARY KEY (member_id, position)
);

CREATE TABLE IF NOT EXISTS mpk_choices (
  nis TEXT NOT NULL REFERENCES voters(nis) ON DELETE CASCADE,
  position TEXT NOT NULL CHECK (position IN ('chair', 'vice')),
  member_id TEXT NOT NULL REFERENCES mpk_members(member_id),
  voted_at INTEGER NOT NULL,
  PRIMARY KEY (nis, position)
);

CREATE TABLE IF NOT EXISTS mpk_ballots (
  ballot_id TEXT PRIMARY KEY NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('chair', 'vice')),
  member_id TEXT NOT NULL REFERENCES mpk_members(member_id),
  cast_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS mpk_ballots_position ON mpk_ballots(position);

CREATE TABLE IF NOT EXISTS app_migrations (
  migration_id TEXT PRIMARY KEY NOT NULL,
  applied_at INTEGER NOT NULL
);
