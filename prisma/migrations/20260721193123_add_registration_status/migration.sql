-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING';

-- Backfill existing users to APPROVED so admins and current students aren't locked out
UPDATE "User" SET "status" = 'APPROVED';
