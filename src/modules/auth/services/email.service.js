import nodemailer from 'nodemailer';
import { env } from '../../../config/env.js';

let transporter;

const getTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
};

export const sendActionEmail = async ({ to, subject, text }) => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    if (env.NODE_ENV === 'development') {
      // Local development only. Never log verification/reset links in production.
      console.info(`[DEV EMAIL] To: ${to}\nSubject: ${subject}\n${text}`);
      return;
    }
    throw new Error('SMTP is not configured. Configure SMTP before using email features.');
  }

  const client = getTransporter();
  return client.sendMail({ from: env.SMTP_FROM, to, subject, text });
};
