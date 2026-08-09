-- CreateTable
CREATE TABLE "MemberRestoreLog" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "restoredById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberRestoreLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberRestoreLog_memberId_createdAt_idx" ON "MemberRestoreLog"("memberId", "createdAt");

-- AddForeignKey
ALTER TABLE "MemberRestoreLog" ADD CONSTRAINT "MemberRestoreLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRestoreLog" ADD CONSTRAINT "MemberRestoreLog_restoredById_fkey" FOREIGN KEY ("restoredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
