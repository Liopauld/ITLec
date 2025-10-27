-- AlterTable
ALTER TABLE "public"."Track" ADD COLUMN     "creatorId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Track" ADD CONSTRAINT "Track_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
