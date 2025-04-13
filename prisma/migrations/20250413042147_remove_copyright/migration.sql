/*
  Warnings:

  - You are about to drop the `copyrights` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `images_copyright_relation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "images_copyright_relation" DROP CONSTRAINT "images_copyright_relation_copyrightId_fkey";

-- DropForeignKey
ALTER TABLE "images_copyright_relation" DROP CONSTRAINT "images_copyright_relation_imageId_fkey";

-- DropTable
DROP TABLE "copyrights";

-- DropTable
DROP TABLE "images_copyright_relation";
