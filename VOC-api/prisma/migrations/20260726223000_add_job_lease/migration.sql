-- CreateTable: JobLease for distributed job locking
CREATE TABLE "JobLease" (
    "name" TEXT NOT NULL,
    "lockedBy" TEXT NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobLease_pkey" PRIMARY KEY ("name")
);
