-- AlterTable
ALTER TABLE "Pointage" ADD COLUMN     "rapportPdfNom" TEXT,
ADD COLUMN     "rapportPdfUrl" TEXT,
ADD COLUMN     "rapportSoumisAt" TIMESTAMP(3),
ADD COLUMN     "rapportTexte" TEXT;
