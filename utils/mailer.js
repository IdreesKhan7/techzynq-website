const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[mailer] SMTP not configured — set SMTP_HOST, SMTP_USER and SMTP_PASS in .env. Contact form emails will NOT be sent.');
    return null;
  }

  if (/^your-.*-(password|here)/i.test(pass) || /password-here$/i.test(pass) || pass === 'changeme') {
    console.warn('[mailer] SMTP_PASS in .env is still a placeholder value. Paste the real password for ' + user + ' there. Contact form emails will NOT be sent until then.');
    return null;
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  return _transporter;
}

/**
 * Send contact form submission to admin email.
 * Returns { ok: true } or { ok: false, error: string }.
 */
async function sendContactEmail({ name, email, reason, message }) {
  const transporter = getTransporter();
  const to = process.env.CONTACT_RECIPIENT || process.env.SMTP_USER;

  if (!transporter || !to) {
    return { ok: false, error: 'SMTP not configured' };
  }

  try {
    await transporter.sendMail({
      from: `"TechZynq Contact" <${process.env.SMTP_USER}>`,
      replyTo: `"${name}" <${email}>`,
      to,
      subject: `[TechZynq Contact] ${reason || 'General Question'} — from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Reason: ${reason || 'General Question'}`,
        '',
        message,
      ].join('\n'),
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#05070D;color:#E4E8F1;padding:32px;border-radius:12px;border:1px solid #1C2236;">
          <div style="border-bottom:1px solid #22D3EE33;padding-bottom:16px;margin-bottom:24px;">
            <h2 style="margin:0;color:#22D3EE;font-size:20px;">New Contact Form Submission</h2>
            <p style="margin:4px 0 0;color:#6B7A99;font-size:13px;">TechZynq Website</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr><td style="padding:8px 0;color:#6B7A99;font-size:13px;width:100px;">Name</td><td style="padding:8px 0;color:#E4E8F1;">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#6B7A99;font-size:13px;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#22D3EE;">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#6B7A99;font-size:13px;">Reason</td><td style="padding:8px 0;color:#E4E8F1;">${reason || 'General Question'}</td></tr>
          </table>
          <div style="background:#0B0F1A;border:1px solid #1C2236;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="margin:0 0 8px;color:#6B7A99;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Message</p>
            <p style="margin:0;color:#E4E8F1;line-height:1.7;white-space:pre-wrap;">${message}</p>
          </div>
          <p style="margin:0;color:#6B7A99;font-size:12px;">Reply directly to this email to respond to ${name}.</p>
        </div>
      `,
    });
    return { ok: true };
  } catch (err) {
    console.error('[mailer] Failed to send contact email:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Send confirmation email to the person who submitted the contact form.
 */
async function sendContactConfirmation({ name, email }) {
  const transporter = getTransporter();
  if (!transporter) return;

  try {
    await transporter.sendMail({
      from: `"TechZynq" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'We received your message — TechZynq',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#05070D;color:#E4E8F1;padding:32px;border-radius:12px;border:1px solid #1C2236;">
          <h2 style="margin:0 0 8px;color:#22D3EE;">Thanks, ${name}!</h2>
          <p style="color:#8892A4;margin:0 0 24px;">We've received your message and will get back to you within 1–2 business days.</p>
          <div style="border-top:1px solid #1C2236;padding-top:16px;margin-top:16px;">
            <p style="margin:0;color:#6B7A99;font-size:12px;">— The TechZynq Team &nbsp;|&nbsp; <a href="https://techzynq.com" style="color:#22D3EE;">techzynq.com</a></p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('[mailer] Failed to send confirmation email:', err.message);
  }
}

module.exports = { sendContactEmail, sendContactConfirmation };
