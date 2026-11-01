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
