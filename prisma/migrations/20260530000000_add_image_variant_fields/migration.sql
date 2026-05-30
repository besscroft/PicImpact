-- AlterTable
ALTER TABLE "images" ADD COLUMN     "image_key" TEXT,
ADD COLUMN     "variants_ready" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ready_max_width" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "images_variants_ready_del_idx" ON "images"("variants_ready", "del");
