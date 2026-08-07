import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { Order } from '../orders/entities/order.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    MailModule,
  ],
  providers: [ReportService],
})
export class ReportModule {}