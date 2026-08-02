-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pointage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "heureArrivee" TEXT,
    "latArrivee" DOUBLE PRECISION,
    "lonArrivee" DOUBLE PRECISION,
    "heureDepart" TEXT,
    "latDepart" DOUBLE PRECISION,
    "lonDepart" DOUBLE PRECISION,
    "ipArrivee" TEXT,
    "ipDepart" TEXT,
    "flags" TEXT[],
    "dureeMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pointage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Pointage_userId_idx" ON "Pointage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Pointage_userId_date_key" ON "Pointage"("userId", "date");

-- AddForeignKey
ALTER TABLE "Pointage" ADD CONSTRAINT "Pointage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
