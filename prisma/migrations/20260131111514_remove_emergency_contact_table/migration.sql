/*
  Warnings:

  - The `emergencyEmail` column on the `Wallet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `EmergencyContact` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmergencyContact" DROP CONSTRAINT "EmergencyContact_walletId_fkey";

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "approvalExpiresAt" TIMESTAMP(3),
ADD COLUMN     "approvalTokenHash" TEXT,
DROP COLUMN "emergencyEmail",
ADD COLUMN     "emergencyEmail" TEXT[];

-- DropTable
DROP TABLE "EmergencyContact";
