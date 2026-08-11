import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import * as puppeteer from 'puppeteer';
import { Order } from '../orders/entities/order.entity';
import { MailService } from '../mail/mail.service';
import * as Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly mailService: MailService,
  ) {}

  @Cron('0 9 * * 1')
  async sendWeeklyReport() {
    this.logger.log('Запуск еженедельного отчёта...');

    try {
      const orders = await this.orderRepository.find({
        relations: { orderDetails: { product: true }, manager: true },
      });

      const html = this.generateHtml(orders);
      const pdf = await this.generatePdf(html);

      await this.mailService.sendReportEmail(
        'elnura.yertay04@gmail.com',
        'Еженедельный отчёт по заказам',
        pdf,
      );

      this.logger.log('Отчёт успешно отправлен');
    } catch (error) {
      this.logger.error(`Ошибка при отправке отчёта: ${error.message}`);
    }
  }

  private generateHtml(orders: Order[]): string {
    const templatePath = join(__dirname, 'templates', 'weekly-report.hbs');
    const source = readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(source);

    const rows = orders.map((order, index) => {
      const total = order.orderDetails?.reduce(
        (sum, d) => sum + Number(d.product?.price || 0) * d.quantity, 0,
      ) ?? 0;
      const discountAmount = (total * Number(order.discount || 0)) / 100;
      return {
        index: index + 1,
        id: order.id,
        customerName: order.customerName,
        finalTotal: (total - discountAmount).toLocaleString('ru-RU'),
      };
    });

    const grandTotal = rows.reduce((sum, r) => sum + Number(r.finalTotal.replace(/\s/g, '')), 0);

    return template({ rows, grandTotal: grandTotal.toLocaleString('ru-RU') });
  }

  private async generatePdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}