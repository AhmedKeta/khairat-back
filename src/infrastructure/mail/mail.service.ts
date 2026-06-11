import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST')?.trim();
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
    const user = this.configService.get<string>('SMTP_USER')?.trim();
    const pass = this.configService.get<string>('SMTP_PASS')?.trim();

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: port === 587,
        auth: { user, pass },
      });
    } else {
      this.logger.warn('SMTP is not configured; password reset emails will not be sent.');
    }
  }

  async sendPasswordResetCode(to: string, code: string): Promise<void> {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const subject = 'Your Khairat password reset code';
    const text = [
      'You requested a password reset for your Khairat account.',
      '',
      `Your verification code is: ${code}`,
      '',
      'This code expires in 15 minutes.',
      'If you did not request this, you can ignore this email.',
    ].join('\n');

    if (!this.transporter) {
      if (nodeEnv !== 'production') {
        this.logger.warn(`[DEV] Password reset code for ${to}: ${code}`);
      }
      return;
    }

    const from =
      this.configService.get<string>('SMTP_FROM')?.trim() ||
      this.configService.get<string>('SMTP_USER')?.trim() ||
      'noreply@khairat.com';

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: `
        <p>You requested a password reset for your Khairat account.</p>
        <p>Your verification code is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>This code expires in 15 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send password reset email to ${to}: ${message}`);

      if (nodeEnv !== 'production') {
        this.logger.warn(`[DEV] Password reset code for ${to}: ${code}`);
      }
    }
  }
}
