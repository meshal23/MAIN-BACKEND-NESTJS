import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  try {
    // Step 1: Create a User for the organization creator
    const user = await prisma.user.create({
      data: {
        id: 'user_' + Math.random().toString(36).substring(7),
        email: `hospital-admin-${Date.now()}@example.com`,
        name: 'Hospital Admin',
        emailVerified: true,
        role: 'super_admin',
      },
    });
    console.log('✓ Created user:', user.email);

    // Step 2: Create an Organization via Prisma
    // (In production, you'd use better-auth's auth.api.createOrganization(), but we're directly seeding here)
    const organization = await prisma.organization.create({
      data: {
        id: 'org_' + Math.random().toString(36).substring(7),
        name: 'Central Hospital',
        slug: 'central-hospital-' + Date.now(),
        metadata: { type: 'hospital' },
      },
    });
    console.log('✓ Created organization:', organization.name);

    // Step 3: Add the user as a member with "hospital_admin" role
    const member = await prisma.member.create({
      data: {
        id: 'member_' + Math.random().toString(36).substring(7),
        organizationId: organization.id,
        userId: user.id,
        role: 'hospital_admin',
      },
    });
    console.log('✓ Added user as member with role:', member.role);

    // Step 4: Create a matching HospitalProfile
    const hospitalProfile = await prisma.hospitalProfile.create({
      data: {
        id: 'hospital_' + Math.random().toString(36).substring(7),
        organizationId: organization.id,
        verificationStatus: 'pending',
        trustScore: 0,
        address: '123 Medical Street, Healthcare City',
      },
    });
    console.log('✓ Created HospitalProfile:', hospitalProfile.id);

    // Step 5: Verify the data was created correctly
    const verifyOrg = await prisma.organization.findUnique({
      where: { id: organization.id },
      include: { members: true },
    });
    console.log('\n📋 Verification:');
    console.log('  Organization:', verifyOrg?.name);
    console.log('  Members:', verifyOrg?.members.length);
    console.log('  Member role:', verifyOrg?.members[0]?.role);

    const verifyProfile = await prisma.hospitalProfile.findUnique({
      where: { id: hospitalProfile.id },
    });
    console.log('  HospitalProfile organizationId:', verifyProfile?.organizationId);

    console.log('\n✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
