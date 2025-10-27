/*
  Warnings:

  - You are about to drop the column `profilePicture` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Profile" ADD COLUMN     "profilePicture" TEXT;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "profilePicture";
