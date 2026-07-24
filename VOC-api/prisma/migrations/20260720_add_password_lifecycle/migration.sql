-- AlterTable
ALTER TABLE "User" ADD COLUMN "temporaryPasswordExpiresAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" DATETIME;
