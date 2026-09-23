import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private prisma: any;

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    try {
      // @ts-ignore - Dynamic import with file extension for ESM
      // Path is relative to dist root when running from compiled code
      const { PrismaClient } = await import('../../generated/prisma/client.js');

      const pool = new Pool({ connectionString });
      const adapter = new PrismaPg(pool);

      this.prisma = new PrismaClient({ adapter });
      await this.prisma.$connect();
      this.logger.log('Prisma connected to database successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.logger.log('Prisma disconnected from database');
    }
  }

  // Proxy Prisma model access
  get example() {
    return this.prisma.example;
  }

  get $transaction() {
    return this.prisma.$transaction.bind(this.prisma);
  }

  // Generic accessor for any model
  query(modelName: string) {
    return this.prisma[modelName];
  }
}
