-- Add the issuer column and unique index required by Better Auth 1.6+/1.7
ALTER TABLE account ADD COLUMN issuer TEXT NOT NULL DEFAULT 'local:credential';

CREATE UNIQUE INDEX IF NOT EXISTS account_issuer_accountId_uidx
  ON account (issuer, accountId);
