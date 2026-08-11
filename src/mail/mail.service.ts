import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private readonly templatesDir = join(__dirname, 'templates');
  private readonly compiledTemplates = new Map<string, Handlebars.TemplateDelegate>();

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

  private renderTemplate(templateName: string, context: Record<string, unknown>): string {
    let template = this.compiledTemplates.get(templateName);

    if (!template) {
      const templatePath = join(this.templatesDir, `${templateName}.hbs`);
      const source = readFileSync(templatePath, 'utf-8');
      template = Handlebars.compile(source);
      this.compiledTemplates.set(templateName, template);
    }

    return template(context);
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const resetLink = `${appUrl}/auth/reset-password?token=${resetToken}`;

    const html = this.renderTemplate('password-reset', { resetLink });

    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM') || this.configService.get<string>('SMTP_USER'),
      to,
      subject: 'Сброс пароля',
      html,
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

  async sendReportEmail(to: string, subject: string, pdf: Buffer, periodLabel?: string) {
    const html = this.renderTemplate('report', { periodLabel });

    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to,
      subject,
      html,
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