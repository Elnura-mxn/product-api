import { NestFactory } from '@nestjs/core';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from '../app.module';
import { ReportService } from './report.service';

async function bootstrap() {
  initializeTransactionalContext();
  const app = await NestFactory.createApplicationContext(AppModule);
  const reportService = app.get(ReportService);

  await reportService.sendWeeklyReport();

  await app.close();
}

bootstrap();