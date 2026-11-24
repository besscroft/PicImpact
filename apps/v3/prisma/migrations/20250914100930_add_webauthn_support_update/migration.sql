/*
  Warnings:

  - You are about to drop the column `webAuthnId` on the `passkey` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[credentialID]` on the table `passkey` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `credentialID` to the `passkey` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "passkey_webAuthnId_key";

-- AlterTable
ALTER TABLE "passkey" DROP COLUMN "webAuthnId",
ADD COLUMN     "aaguid" TEXT,
ADD COLUMN     "credentialID" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "passkey_credentialID_key" ON "passkey"("credentialID");
