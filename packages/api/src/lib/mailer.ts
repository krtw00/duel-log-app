import nodemailer, { type Transporter } from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST ?? 'smtp-relay.brevo.com';
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USERNAME = process.env.SMTP_USERNAME;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const MAIL_FROM = process.env.MAIL_FROM ?? 'Duel Log <no-reply@duel-log.codenica.dev>';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    if (!SMTP_USERNAME || !SMTP_PASSWORD) {
      throw new Error('SMTP_USERNAME / SMTP_PASSWORD env not configured');
    }
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD },
    });
  }
  return transporter;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail({ to, subject, text, html }: SendMailOptions): Promise<void> {
  const tx = getTransporter();
  await tx.sendMail({ from: MAIL_FROM, to, subject, text, html });
}

export function isMailerConfigured(): boolean {
  return Boolean(SMTP_USERNAME && SMTP_PASSWORD);
}
