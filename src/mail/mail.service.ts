import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get<string>('SMTP_PORT')) || 587,
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const resetLink = `${appUrl}/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM') || this.configService.get<string>('SMTP_USER'),
      to,
      subject: 'Сброс пароля',
      html: `
        <p>Вы запросили сброс пароля.</p>
        <p>Перейдите по ссылке, чтобы задать новый пароль (ссылка активна 1 час):</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.</p>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Письмо со сбросом пароля отправлено на ${to}`);
      return info;
    } catch (error) {
      this.logger.error(`Не удалось отправить письмо на ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendReportEmail(to: string, subject: string, pdf: Buffer) {
    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to,
      subject,
      html: `
        <p>Здравствуйте,</p>
        <p>Во вложении еженедельный отчёт по заказам.</p>
      `,
      attachments: [
        {
          filename: `report-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdf,
          contentType: 'application/pdf',
        },
      ],
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Отчёт отправлен на ${to}`);
      return info;
    } catch (error) {
      this.logger.error(`Не удалось отправить отчёт на ${to}: ${error.message}`);
      throw error;
    }
  }
}