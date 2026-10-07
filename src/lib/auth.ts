// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { admin, organization } from 'better-auth/plugins';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { defaultAc } from 'better-auth/plugins/organization/access';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// 1. Establish the connection pool using your database environment variable
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 2. Pass the constructed adapter directly into the constructor argument
const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({ defaultRole: 'PARTICIPANT' }),
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: 'owner',
      roles: {
        // Built-in roles with default access control
        owner: defaultAc.newRole({
          organization: ['update', 'delete'],
          member: ['create', 'update', 'delete'],
          invitation: ['create', 'cancel'],
          team: ['create', 'update', 'delete'],
          ac: ['create', 'read', 'update', 'delete'],
        }),
        admin: defaultAc.newRole({
          organization: ['update'],
          member: ['create', 'update', 'delete'],
          invitation: ['create', 'cancel'],
          team: ['create', 'update', 'delete'],
          ac: ['read'],
        }),
        // Custom domain-specific roles
        hospital_admin: defaultAc.newRole({
          organization: ['update'],
          member: ['create', 'update'],
          invitation: ['create'],
          team: [],
          ac: ['read'],
        }),
        doctor: defaultAc.newRole({
          organization: [],
          member: [],
          invitation: [],
          team: [],
          ac: ['read'],
        }),
        nurse: defaultAc.newRole({
          organization: [],
          member: [],
          invitation: [],
          team: [],
          ac: ['read'],
        }),
        campaign_organizer: defaultAc.newRole({
          organization: ['update'],
          member: ['create'],
          invitation: ['create'],
          team: [],
          ac: ['read'],
        }),
        member: defaultAc.newRole({
          organization: [],
          member: [],
          invitation: [],
          team: [],
          ac: ['read'],
        }),
      }, 
      dynamicAccessControl: {
        enabled: true,
      },
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'PARTICIPANT',
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
