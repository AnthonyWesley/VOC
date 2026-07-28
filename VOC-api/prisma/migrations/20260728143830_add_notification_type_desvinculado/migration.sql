-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MEMBRO_DESVINCULADO';

-- CreateIndex
CREATE INDEX "Post_authorId_status_updatedAt_id_idx" ON "Post"("authorId", "status", "updatedAt", "id");
