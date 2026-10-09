import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { to, subject, text, pdfBase64, filename, attachments: customAttachments, cc, replyTo } = req.body;

  // 環境変数から設定を取得
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const senderFrom = process.env.SMTP_FROM || smtpUser;
  const allowedTo = (process.env.ALLOWED_TO_EMAIL || 'takishita@kashiwa-f.com').trim().toLowerCase();

  if (!smtpHost || !smtpUser || !smtpPass) {
    return res.status(500).json({ success: false, error: 'SMTP設定が正しく設定されていません。' });
  }

  // 送信先制限
  if (to && to.trim().toLowerCase() !== allowedTo) {
      return res.status(403).json({ success: false, error: '許可されていない送信先です。' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const attachments = [];
    if (pdfBase64) {
      attachments.push({
        filename: filename || 'order.pdf',
        content: Buffer.from(pdfBase64, 'base64')
      });
    }

    if (Array.isArray(customAttachments)) {
      for (const att of customAttachments) {
        if (att.base64 && att.filename) {
          attachments.push({
            filename: att.filename,
            content: Buffer.from(att.base64, 'base64')
          });
        }
      }
    }

    const info = await transporter.sendMail({
      from: `"${senderFrom}" <${smtpUser}>`,
      to: allowedTo,
      cc: cc,
      replyTo: replyTo,
      subject: subject || '注文書送付依頼書',
      text: text,
      attachments: attachments
    });

    return res.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Error sending mail:', error);
    return res.status(500).json({ success: false, error: error.message || 'メール送信中にエラーが発生しました。' });
  }
}
