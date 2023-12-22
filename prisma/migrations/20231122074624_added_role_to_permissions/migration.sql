/*
  Warnings:

  - Added the required column `rid` to the `Permission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "rid" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_rid_fkey" FOREIGN KEY ("rid") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
