-- Contrainte d'unicité sur MarcheAttribue pour éviter les doublons inter-sources
-- Critère : acheteurSiret + titulaireSiret + montant + dateNotification + md5(objet)
-- L'objet est hashé en MD5 pour éviter les problèmes de longueur d'index.
-- Partiel (WHERE NOT NULL) pour ne pas bloquer les marchés sans SIRET.

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "MarcheAttribue_dedup_idx"
ON "MarcheAttribue" ("acheteurSiret", "titulaireSiret", montant, "dateNotification", md5(objet))
WHERE "acheteurSiret" IS NOT NULL
  AND "titulaireSiret" IS NOT NULL
  AND montant IS NOT NULL
  AND "dateNotification" IS NOT NULL;
