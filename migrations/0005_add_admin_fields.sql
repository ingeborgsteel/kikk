-- Add the fields required by the Better Auth admin plugin and promote the owner account.
ALTER TABLE "user" ADD COLUMN "role" text;
ALTER TABLE "user" ADD COLUMN "banned" integer DEFAULT 0;
ALTER TABLE "user" ADD COLUMN "banReason" text;
ALTER TABLE "user" ADD COLUMN "banExpires" date;
ALTER TABLE "session" ADD COLUMN "impersonatedBy" text;

UPDATE "user" SET "role" = 'admin' WHERE "email" = 'ingeborg@steel.no';
