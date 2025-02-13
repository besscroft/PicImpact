/*
  Warnings:

  - You are about to drop the column `star` on the `images` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "images" DROP COLUMN "star",
ADD COLUMN     "show_on_mainpage" SMALLINT NOT NULL DEFAULT 1;
