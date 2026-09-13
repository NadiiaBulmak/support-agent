import { Module } from '@nestjs/common';
import { PrismaService } from '#/modules/db/prisma/prisma.service.js';

@Module({
providers: [PrismaService],
  exports: [PrismaService],
})
export class DbModule {}
