-- AlterTable
ALTER TABLE "albums" ADD COLUMN     "allow_download" SMALLINT NOT NULL DEFAULT 1,
ADD COLUMN     "license" TEXT;
