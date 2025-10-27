/*
  Warnings:

  - You are about to drop the column `github` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `linkedin` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Profile" DROP COLUMN "github",
DROP COLUMN "linkedin";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "github" TEXT,
ADD COLUMN     "linkedin" TEXT;
