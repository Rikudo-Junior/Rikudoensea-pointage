-- AlterTable
ALTER TABLE "User" ADD COLUMN     "classe" TEXT NOT NULL DEFAULT 'ISE';

-- CreateTable
CREATE TABLE "DirecteurAccount" (
    "id" TEXT NOT NULL DEFAULT 'directeur',
    "passwordHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirecteurAccount_pkey" PRIMARY KEY ("id")
);
