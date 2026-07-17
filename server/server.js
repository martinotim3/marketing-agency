require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-().\s]*$/;
const ALLOWED_SUBJECTS = ['General', 'Support', 'Sales'];

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: function (req, res) {
    res.status(429).json({ ok: false, error: 'Too many requests, try again later' });
  }
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function stripHeaderInjection(value) {
  return String(value).replace(/[\r\n]/g, '');
}

app.post('/api/contact', contactLimiter, function (req, res) {
  const body = req.body || {};

  // Honeypot: bots fill hidden fields. Bail out quietly with a fake success
  // so the bot doesn't learn its submission was rejected.
  if (body.website && String(body.website).trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Name, email and message are required' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'Enter a valid email address' });
  }
  if (phone && !PHONE_RE.test(phone)) {
    return res.status(400).json({ ok: false, error: 'Enter a valid phone number' });
  }
  if (!ALLOWED_SUBJECTS.includes(subject)) {
    return res.status(400).json({ ok: false, error: 'Subject must be General, Support, or Sales' });
  }

  const safeName = stripHeaderInjection(name);
  const safeSubject = stripHeaderInjection(subject);

  const textBody = [
    `Name: ${safeName}`,
    `Email: ${email}`,
    `Phone: ${phone || '—'}`,
    '',
    'Message:',
    message
  ].join('\n');

  transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.CONTACT_TO,
    replyTo: email,
    subject: `[FoxTail Contact - ${safeSubject}] from ${safeName}`,
    text: textBody
  })
    .then(function () {
      res.status(200).json({ ok: true });
    })
    .catch(function (err) {
      console.error('Failed to send contact email:', err);
      res.status(500).json({ ok: false, error: "Couldn't send, try again or email us directly" });
    });
});

const PORT = 3000;
app.listen(PORT, '127.0.0.1', function () {
  console.log(`Contact form service listening on 127.0.0.1:${PORT}`);
});
