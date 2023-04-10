/*
  Warnings:

  - You are about to drop the `Photos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Photos" DROP CONSTRAINT "Photos_ksn_fkey";

-- DropTable
DROP TABLE "Photos";

-- CreateTable
CREATE TABLE "Photo" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ksn" INTEGER,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_ksn_fkey" FOREIGN KEY ("ksn") REFERENCES "Account"("ksn") ON DELETE SET NULL ON UPDATE CASCADE;
