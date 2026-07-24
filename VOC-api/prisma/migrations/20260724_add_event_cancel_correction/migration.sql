-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledById" TEXT;

-- CreateTable
CREATE TABLE "EventCorrection" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "correctedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventCorrection_eventId_createdAt_idx" ON "EventCorrection"("eventId", "createdAt");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCorrection" ADD CONSTRAINT "EventCorrection_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCorrection" ADD CONSTRAINT "EventCorrection_correctedById_fkey" FOREIGN KEY ("correctedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
