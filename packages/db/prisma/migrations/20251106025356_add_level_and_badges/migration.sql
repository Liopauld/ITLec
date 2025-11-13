/*
  Warnings:

  - You are about to drop the column `attendedAt` on the `EventRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedMins` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `isDraft` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `resources` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `subtitle` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `profilePicture` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the `Badge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobListing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LessonProgress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Mentor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Quiz` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Submission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BadgeToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `content` to the `Lesson` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "EventRegistration" DROP CONSTRAINT "EventRegistration_userId_fkey";

-- DropForeignKey
ALTER TABLE "LessonProgress" DROP CONSTRAINT "LessonProgress_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "LessonProgress" DROP CONSTRAINT "LessonProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "Mentor" DROP CONSTRAINT "Mentor_userId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_quizId_fkey";

-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_userId_fkey";

-- DropForeignKey
ALTER TABLE "Track" DROP CONSTRAINT "Track_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "_BadgeToUser" DROP CONSTRAINT "_BadgeToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_BadgeToUser" DROP CONSTRAINT "_BadgeToUser_B_fkey";

-- DropIndex
DROP INDEX "EventRegistration_eventId_userId_key";

-- DropIndex
DROP INDEX "Lesson_moduleId_order_idx";

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "aiAnalysis" TEXT,
ADD COLUMN     "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "weaknesses" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "maxAttendees" INTEGER,
ALTER COLUMN "creatorId" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "EventRegistration" DROP COLUMN "attendedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "title" TEXT,
ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "authorId",
DROP COLUMN "body",
DROP COLUMN "createdAt",
DROP COLUMN "estimatedMins",
DROP COLUMN "isDraft",
DROP COLUMN "resources",
DROP COLUMN "subtitle",
DROP COLUMN "updatedAt",
DROP COLUMN "version",
ADD COLUMN     "assets" JSONB,
ADD COLUMN     "content" JSONB NOT NULL,
ALTER COLUMN "title" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "title" TEXT,
ALTER COLUMN "content" DROP NOT NULL,
ALTER COLUMN "order" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "PersonalCalendarEvent" ADD COLUMN     "color" TEXT,
ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "profilePicture";

-- AlterTable
ALTER TABLE "SessionRequest" ADD COLUMN     "description" TEXT,
ADD COLUMN     "topic" TEXT;

-- AlterTable
ALTER TABLE "TrackProgress" ALTER COLUMN "completedModules" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "completedGames" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "startedAt" DROP NOT NULL,
ALTER COLUMN "startedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "profilePicture" TEXT;

-- DropTable
DROP TABLE "Badge";

-- DropTable
DROP TABLE "JobListing";

-- DropTable
DROP TABLE "LessonProgress";

-- DropTable
DROP TABLE "Mentor";

-- DropTable
DROP TABLE "Quiz";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "Submission";

-- DropTable
DROP TABLE "_BadgeToUser";

-- AddForeignKey
ALTER TABLE "SessionRequest" ADD CONSTRAINT "SessionRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRequest" ADD CONSTRAINT "SessionRequest_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
