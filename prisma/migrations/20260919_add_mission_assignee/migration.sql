-- Assignation d'une mission à un commercial (colonne + FK vers User, nullable).
-- Appliquée via scripts/migrate-mission-assignee.ts (voir ce fichier) plutôt
-- que via `prisma db push`, pour ne toucher que ce changement précis et ne
-- pas risquer d'appliquer d'autres écarts accumulés entre schema.prisma et
-- la base de production.

ALTER TABLE "Mission" ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;

CREATE INDEX IF NOT EXISTS "Mission_assignedToId_idx" ON "Mission"("assignedToId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Mission_assignedToId_fkey'
  ) THEN
    ALTER TABLE "Mission"
      ADD CONSTRAINT "Mission_assignedToId_fkey"
      FOREIGN KEY ("assignedToId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
