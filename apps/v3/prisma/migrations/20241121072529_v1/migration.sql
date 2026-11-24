-- AlterTable
ALTER TABLE "images" ADD COLUMN     "type" SMALLINT NOT NULL DEFAULT 1,
ADD COLUMN     "video_url" TEXT;
