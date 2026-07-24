-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventParticipantType" AS ENUM ('MEMBER', 'VISITOR');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "closeOperationId" TEXT,
ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "EventMember" ADD COLUMN     "participantType" "EventParticipantType" NOT NULL DEFAULT 'MEMBER';

-- CreateIndex
CREATE UNIQUE INDEX "Event_closeOperationId_key" ON "Event"("closeOperationId");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_deletedAt_startsAt_idx" ON "Event"("deletedAt", "startsAt");

-- CHECK constraints
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_membersCount_nonnegative" CHECK ("membersCount" >= 0);
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_visitorsCount_nonnegative" CHECK ("visitorsCount" >= 0);
ALTER TABLE "Event" ADD CONSTRAINT "Event_endsAt_gte_startsAt" CHECK ("endsAt" IS NULL OR "endsAt" >= "startsAt");

-- Backfill status for existing events
UPDATE "Event" SET "status" = 'FINISHED' WHERE "endsAt" IS NOT NULL AND "deletedAt" IS NULL;
UPDATE "Event" SET "status" = 'CANCELLED' WHERE "deletedAt" IS NOT NULL;

-- Backfill participantType (historical approximation, one-time)
UPDATE "EventMember" em
SET "participantType" = CASE
  WHEN m."churchJoinDate" <= e."startsAt" THEN 'MEMBER'::"EventParticipantType"
  ELSE 'VISITOR'::"EventParticipantType"
END
FROM "Member" m, "Event" e
WHERE em."memberId" = m."id"
  AND em."eventId" = e."id";

-- CreateIndex
CREATE INDEX "Event_createdById_idx" ON "Event"("createdById");
