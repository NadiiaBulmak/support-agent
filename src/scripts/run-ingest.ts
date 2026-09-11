import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { IngestService } from '../knowledge/ingest/ingest.service.js';

const bootstrap = async () => {
  console.log('Ініціалізація NestJS контексту...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const ingestService = app.get(IngestService);
  
  await ingestService.ingestKnowledge();
  
  await app.close();
  process.exit(0);
}

bootstrap();