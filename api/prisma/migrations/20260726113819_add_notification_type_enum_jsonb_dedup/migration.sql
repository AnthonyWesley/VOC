-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MEMBER_AUSENTE', 'MEMBRO_VINCULADO', 'MEMBRO_REMOVIDO', 'EVENTO_CRIADO', 'MEMBRO_ESCALADO');

-- Safely convert type column: add new column, backfill, drop old, rename
ALTER TABLE "Notification" ADD COLUMN "type_new" "NotificationType";

-- Backfill: cast valid text values to enum; fallback for unknown values
UPDATE "Notification"
SET "type_new" = CASE
  WHEN "type" = 'MEMBER_AUSENTE' THEN 'MEMBER_AUSENTE'::"NotificationType"
  WHEN "type" = 'MEMBRO_VINCULADO' THEN 'MEMBRO_VINCULADO'::"NotificationType"
  WHEN "type" = 'MEMBRO_REMOVIDO' THEN 'MEMBRO_REMOVIDO'::"NotificationType"
  WHEN "type" = 'EVENTO_CRIADO' THEN 'EVENTO_CRIADO'::"NotificationType"
  WHEN "type" = 'MEMBRO_ESCALADO' THEN 'MEMBRO_ESCALADO'::"NotificationType"
  ELSE NULL
END;

-- Drop old column and rename new one
ALTER TABLE "Notification" DROP COLUMN "type";
ALTER TABLE "Notification" RENAME COLUMN "type_new" TO "type";

-- Make type NOT NULL (safe: 0 invalid rows after backfill)
ALTER TABLE "Notification" ALTER COLUMN "type" SET NOT NULL;

-- Safely convert payload column: add JSONB column, backfill with CAST, drop old, rename
ALTER TABLE "Notification" ADD COLUMN "payload_json" JSONB;

-- Backfill: convert valid JSON strings; invalid ones become NULL
UPDATE "Notification"
SET "payload_json" = CASE
  WHEN "payload" IS NULL THEN NULL
  ELSE "payload"::jsonb
END;

-- Drop old payload column and rename new one
ALTER TABLE "Notification" DROP COLUMN "payload";
ALTER TABLE "Notification" RENAME COLUMN "payload_json" TO "payload";

-- Add new columns
ALTER TABLE "Notification" ADD COLUMN "payloadVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Notification" ADD COLUMN "deduplicationKey" TEXT;

-- Create unique index on userId + deduplicationKey
CREATE UNIQUE INDEX "Notification_userId_deduplicationKey_key" ON "Notification"("userId", "deduplicationKey");
