/*
  Warnings:

  - You are about to drop the column `basePermission` on the `Application` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Application" DROP COLUMN "basePermission",
ADD COLUMN     "baseRole" TEXT NOT NULL DEFAULT 'KREATIVE_USER';
