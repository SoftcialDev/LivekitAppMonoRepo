/*
  Warnings:

  - You are about to drop the column `adminId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_adminId_fkey";

-- DropIndex
DROP INDEX "User_adminId_idx";

-- AlterTable
ALTER TABLE "PendingCommand" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PresenceHistory" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "adminId",
ADD COLUMN     "supervisorId" UUID,
ALTER COLUMN "id" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "User_supervisorId_idx" ON "User"("supervisorId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
