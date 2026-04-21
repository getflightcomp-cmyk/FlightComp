import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, text, headers }) {
  const payload = {
    from: 'FlightComp <support@getflightcomp.com>',
    to,
    subject,
    html,
    text,
  };

  if (headers && typeof headers === 'object') {
    payload.headers = headers;
  }

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    console.error('Email send error:', error);
    throw error;
  }

  return data;
}
