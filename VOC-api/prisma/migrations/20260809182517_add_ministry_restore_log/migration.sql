-- AlterTable
ALTER TABLE "Ministry" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MinistryRestoreLog" (
    "id" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "restoredById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MinistryRestoreLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MinistryRestoreLog_ministryId_createdAt_idx" ON "MinistryRestoreLog"("ministryId", "createdAt");

-- AddForeignKey
ALTER TABLE "MinistryRestoreLog" ADD CONSTRAINT "MinistryRestoreLog_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinistryRestoreLog" ADD CONSTRAINT "MinistryRestoreLog_restoredById_fkey" FOREIGN KEY ("restoredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
