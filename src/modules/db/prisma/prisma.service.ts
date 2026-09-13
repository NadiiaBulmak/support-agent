import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '#/generated/prisma/client.js';
import { loggerMessages } from '#/shared/constants/loggerMessage.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);

    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      this.logger.error(loggerMessages.databaseConnectionFailed, error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}