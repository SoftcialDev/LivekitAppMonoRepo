/*
  Warnings:

  - You are about to drop the column `delivered` on the `PendingCommand` table. All the data in the column will be lost.
  - You are about to drop the column `employeeEmail` on the `PendingCommand` table. All the data in the column will be lost.
  - You are about to drop the column `roleChangedAt` on the `User` table. All the data in the column will be lost.
  - Added the required column `employeeId` to the `PendingCommand` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `command` on the `PendingCommand` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CommandType" AS ENUM ('START', 'STOP');

-- AlterTable
ALTER TABLE "PendingCommand" DROP COLUMN "delivered",
DROP COLUMN "employeeEmail",
ADD COLUMN     "acknowledged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "employeeId" UUID NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
DROP COLUMN "command",
ADD COLUMN     "command" "CommandType" NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "roleChangedAt";

-- CreateIndex
CREATE INDEX "PendingCommand_employeeId_acknowledged_idx" ON "PendingCommand"("employeeId", "acknowledged");

-- CreateIndex
CREATE INDEX "PendingCommand_expiresAt_idx" ON "PendingCommand"("expiresAt");

-- AddForeignKey
ALTER TABLE "PendingCommand" ADD CONSTRAINT "PendingCommand_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
