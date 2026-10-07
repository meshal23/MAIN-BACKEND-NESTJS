-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "org_roles";

-- CreateTable
CREATE TABLE "org_roles"."organizationRole" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "organizationRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable for many-to-many relationship between Member and User
CREATE TABLE "auth"."_MemberToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MemberToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- Add inviterId column to invitation if it doesn't exist
ALTER TABLE "auth"."invitation" ADD COLUMN "inviterId" TEXT;

-- CreateIndex
CREATE INDEX "organizationRole_organizationId_idx" ON "org_roles"."organizationRole"("organizationId");

-- CreateIndex
CREATE INDEX "organizationRole_role_idx" ON "org_roles"."organizationRole"("role");

-- CreateIndex
CREATE INDEX "_MemberToUser_B_index" ON "auth"."_MemberToUser"("B");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "auth"."invitation"("email");

-- AddForeignKey for organizationRole
ALTER TABLE "org_roles"."organizationRole" ADD CONSTRAINT "organizationRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for _MemberToUser
ALTER TABLE "auth"."_MemberToUser" ADD CONSTRAINT "_MemberToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "auth"."member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "auth"."_MemberToUser" ADD CONSTRAINT "_MemberToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "auth"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for invitation.inviterId
ALTER TABLE "auth"."invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "auth"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
