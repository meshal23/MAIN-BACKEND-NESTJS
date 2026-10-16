/*
  Warnings:

  - Made the column `inviterId` on table `invitation` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "auth"."invitation" ALTER COLUMN "inviterId" SET NOT NULL;
