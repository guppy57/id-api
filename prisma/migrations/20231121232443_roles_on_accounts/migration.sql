-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "RolesOnAccounts" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ksn" INTEGER NOT NULL,
    "rid" TEXT NOT NULL,

    CONSTRAINT "RolesOnAccounts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RolesOnAccounts" ADD CONSTRAINT "RolesOnAccounts_ksn_fkey" FOREIGN KEY ("ksn") REFERENCES "Account"("ksn") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolesOnAccounts" ADD CONSTRAINT "RolesOnAccounts_rid_fkey" FOREIGN KEY ("rid") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
