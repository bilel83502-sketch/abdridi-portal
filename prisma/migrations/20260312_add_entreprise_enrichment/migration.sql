-- CreateTable
CREATE TABLE "Entreprise" (
    "siren" TEXT NOT NULL,
    "raisonSociale" TEXT NOT NULL,
    "formeJuridique" TEXT,
    "codeNaf" TEXT,
    "activite" TEXT,
    "effectifs" TEXT,
    "adresse" TEXT,
    "dateCreation" TIMESTAMP(3),
    "statut" TEXT,
    "enrichiLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("siren")
);

-- CreateIndex
CREATE INDEX "Entreprise_raisonSociale_idx" ON "Entreprise"("raisonSociale");
