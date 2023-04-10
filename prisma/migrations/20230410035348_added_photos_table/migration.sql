-- CreateTable
CREATE TABLE "Photos" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ksn" INTEGER,

    CONSTRAINT "Photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Photos" ADD CONSTRAINT "Photos_ksn_fkey" FOREIGN KEY ("ksn") REFERENCES "Account"("ksn") ON DELETE SET NULL ON UPDATE CASCADE;
