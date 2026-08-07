import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import * as puppeteer from 'puppeteer';
import { Order } from '../orders/entities/order.entity';
import { MailService } from '../mail/mail.service';

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
        'arystan@maxinum.co',
        'Еженедельный отчёт по заказам',
        pdf,
      );

      this.logger.log('Отчёт успешно отправлен');
    } catch (error) {
      this.logger.error(`Ошибка при отправке отчёта: ${error.message}`);
    }
  }

  private generateHtml(orders: Order[]): string {
    const rows = orders
      .map((order, index) => {
        const total = order.orderDetails?.reduce((sum, detail) => {
          const price = Number(detail.product?.price || 0);
          return sum + price * detail.quantity;
        }, 0) ?? 0;

        const discount = Number(order.discount || 0);
        const discountAmount = (total * discount) / 100;
        const finalTotal = total - discountAmount;

        return `
          <tr>
            <td class="col-index">${index + 1}</td>
            <td>${order.id}</td>
            <td class="col-accent">${order.customerName}</td>
            <td>${new Date(order.date).toLocaleDateString('ru-RU')}</td>
            <td>${order.status}</td>
            <td>${order.manager ? `${order.manager.name} ${order.manager.surname}` : '—'}</td>
            <td class="col-num">${total.toLocaleString('ru-RU')} KZT</td>
            <td class="col-num">${discount}%</td>
            <td class="col-num col-bold">${finalTotal.toLocaleString('ru-RU')} KZT</td>
          </tr>
        `;
      })
      .join('');

    const subtotal = orders.reduce((sum, order) => {
      const total = order.orderDetails?.reduce((s, detail) => {
        const price = Number(detail.product?.price || 0);
        return s + price * detail.quantity;
      }, 0) ?? 0;
      return sum + total;
    }, 0);

    const totalDiscountAmount = orders.reduce((sum, order) => {
      const total = order.orderDetails?.reduce((s, detail) => {
        const price = Number(detail.product?.price || 0);
        return s + price * detail.quantity;
      }, 0) ?? 0;
      const discount = Number(order.discount || 0);
      return sum + (total * discount) / 100;
    }, 0);

    const grandTotal = subtotal - totalDiscountAmount;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 13px; color: #333; padding: 40px; }

          .header { display: flex; justify-content: space-between; margin-bottom: 32px; }
          .company-name { font-size: 22px; font-weight: bold; color: #1a2744; letter-spacing: 0.3px; }
          .company-info { font-size: 12px; color: #6b7280; margin-top: 8px; line-height: 1.7; }

          .report-title { font-size: 32px; font-weight: bold; color: #1a2744; margin-bottom: 6px; text-align: right; }
          .report-meta { font-size: 12px; color: #6b7280; text-align: right; line-height: 1.7; }
          .report-meta strong { color: #333; }

          .divider { border: none; border-top: 2px solid #1a2744; margin: 24px 0 28px; }

          .section-label {
            font-size: 11px;
            font-weight: bold;
            color: #3b5c9e;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 8px;
          }

          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          thead { background-color: #1a2744; }
          thead th {
            padding: 10px 12px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }
          thead th.col-num { text-align: right; }
          tbody tr:nth-child(even) { background-color: #f7f7f8; }
          tbody td { padding: 10px 12px; border-bottom: 1px solid #e8e8ea; color: #333; }
          .col-index { color: #1a2744; font-weight: bold; }
          .col-accent { color: #3b5c9e; font-weight: 600; }
          .col-num { text-align: right; }
          .col-bold { font-weight: bold; color: #1a2744; }

          .totals { margin-top: 28px; display: flex; justify-content: flex-end; }
          .totals table { width: auto; margin-left: auto; }
          .totals td { padding: 6px 14px; font-size: 13px; color: #6b7280; }
          .totals td:last-child { text-align: right; color: #333; }
          .totals .grand-total td {
            font-size: 17px;
            font-weight: bold;
            color: #1a2744;
            border-top: 2px solid #1a2744;
            padding-top: 12px;
          }
          .totals .grand-total td:first-child { color: #1a2744; }

          .footer {
            margin-top: 60px;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #e8e8ea;
            padding-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">MAXINUM LLP</div>
            <div class="company-info">
              Almaty, BC "Kausar", Dostyk ave. 210<br>
              Kazakhstan, 050051<br>
              billing@maxinum.kz | +7 727 350 12 34
            </div>
          </div>
          <div>
            <div class="report-title">WEEKLY REPORT</div>
            <div class="report-meta">
              <strong>Generated:</strong> ${new Date().toLocaleDateString('ru-RU')}<br>
              <strong>Total orders:</strong> ${orders.length}
            </div>
          </div>
        </div>

        <hr class="divider">

        <div class="section-label">Order Summary</div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Manager</th>
              <th class="col-num">Subtotal</th>
              <th class="col-num">Discount</th>
              <th class="col-num">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="9" style="text-align:center; padding: 20px;">No orders found</td></tr>'}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td>Total orders</td>
              <td>${orders.length}</td>
            </tr>
            <tr>
              <td>Subtotal</td>
              <td>${subtotal.toLocaleString('ru-RU')} KZT</td>
            </tr>
            <tr>
              <td>Total discount</td>
              <td>-${totalDiscountAmount.toLocaleString('ru-RU')} KZT</td>
            </tr>
            <tr class="grand-total">
              <td>Grand Total</td>
              <td>${grandTotal.toLocaleString('ru-RU')} KZT</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          This report was generated automatically · MAXINUM LLP · billing@maxinum.kz · maxinum.kz
        </div>
      </body>
      </html>
    `;
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