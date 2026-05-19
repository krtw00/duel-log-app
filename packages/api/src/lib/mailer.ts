const BREVO_API_KEY = process.env.BREVO_API_KEY;
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME ?? 'Duel Log';
const MAIL_FROM_EMAIL = process.env.MAIL_FROM_EMAIL ?? 'no-reply@duel-log.codenica.dev';

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail({ to, subject, text, html }: SendMailOptions): Promise<void> {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY env not configured');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: MAIL_FROM_NAME, email: MAIL_FROM_EMAIL },
      to: [{ email: to }],
      subject,
      textContent: text,
      ...(html ? { htmlContent: html } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Brevo API error ${response.status}: ${errorBody}`);
  }
}

export function isMailerConfigured(): boolean {
  return Boolean(BREVO_API_KEY);
}
