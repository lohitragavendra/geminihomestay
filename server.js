import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';

const app = express();
const port = process.env.PORT || 3000;
const contactToEmail = process.env.CONTACT_TO_EMAIL || 'venu.gemini.homestay@gmail.com';

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('.'));

app.use('/api/contact', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
}));

function createTransport() {
  const host = process.env.SMTP_HOST;
  const portValue = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: portValue,
    secure,
    auth: {
      user,
      pass
    }
  });
}

app.post('/api/contact', async (req, res) => {
  const { name, email, dates, guests, message, honeypot, formStart } = req.body || {};
  const submissionAge = Number(formStart ? Date.now() - Number(formStart) : Infinity);

  if (honeypot) {
    return res.status(400).json({ ok: false, message: 'Spam detected.' });
  }

  if (!name || !dates || !guests || !message) {
    return res.status(400).json({ ok: false, message: 'Please complete the required fields.' });
  }

  if (Number.isFinite(submissionAge) && submissionAge < 4000) {
    return res.status(400).json({ ok: false, message: 'Please take a moment before submitting.' });
  }

  const transporter = createTransport();
  if (!transporter) {
    return res.status(503).json({
      ok: false,
      message: 'Mail service is not configured yet. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.'
    });
  }

  const subject = `New enquiry from Gemini Homestay website: ${name}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email || 'Not provided'}`,
    `Dates: ${dates}`,
    `Guests: ${guests}`,
    '',
    'Message:',
    message
  ].join('\n');

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `Gemini Homestay <${process.env.SMTP_USER}>`,
      to: contactToEmail,
      replyTo: email || undefined,
      subject,
      text
    });

    return res.json({ ok: true, message: 'Enquiry sent successfully.' });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Unable to send enquiry at the moment.' });
  }
});

app.listen(port, () => {
  console.log(`Gemini Homestay site running on http://localhost:${port}`);
});