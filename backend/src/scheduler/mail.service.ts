import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      });
      this.logger.log('Mail service configured');
    } else {
      this.logger.warn('SMTP not configured — email reminders disabled');
    }
  }

  async sendWorkoutReminder(to: string, userName: string, workoutName: string, time: string) {
    if (!this.transporter) return;

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `Recordatorio: ${workoutName} en 30 minutos`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0e1828;color:#e0e8f8;border-radius:12px">
            <h2 style="color:#3d8bef;margin:0 0 16px">ChoppedApp</h2>
            <p style="font-size:16px">Hola <strong>${userName}</strong>,</p>
            <p style="font-size:15px">
              En <strong>30 minutos</strong> toca tu rutina de
              <strong style="color:#3d8bef">${workoutName}</strong> (${time} hs).
            </p>
            <p style="color:#8899bb;font-size:13px">Prepara tu ropa y equipamiento. ¡A entrenar!</p>
          </div>`,
      });
      this.logger.log(`Reminder sent to ${to} for "${workoutName}"`);
    } catch (err) {
      this.logger.error(`Failed to send reminder to ${to}: ${err.message}`);
    }
  }
}
