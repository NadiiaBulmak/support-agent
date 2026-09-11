-- This is an empty migration.
ALTER TABLE "document_chunks" ALTER COLUMN "embedding" TYPE vector(3072);