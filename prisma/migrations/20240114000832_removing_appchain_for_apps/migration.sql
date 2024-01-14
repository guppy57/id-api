/*
  Warnings:

  - You are about to drop the column `appchain` on the `Application` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Application_appchain_key";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "appchain";
