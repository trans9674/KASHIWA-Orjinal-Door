import express from 'express';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbkpzrjgxkmnoxfhwwlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia3B6cmpneGttbm94Zmh3d2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDEyMjIsImV4cCI6MjA4NTk3NzIyMn0.dZiTxmhXFsiGig5v6Igf00MxJgdFGz-o5iv1skMpj-4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // メール送信APIエンドポイント
  app.post('/api/send-mail', async (req, res) => {
    try {
      const { to, subject, text, pdfBase64, filename } = req.body;

      // データベースから最新のメール送信設定を取得
      let emailConfig = {
        host: '',
        port: 587,
        user: '',
        pass: '',
        from: '',
        toEmail: 'takishita@kashiwa-f.com'
      };

      try {
        const { data: configRecord } = await supabase
          .from('baseboard_master')
          .select('pb_image_url')
          .eq('product', '__email_settings_config__')
          .maybeSingle();

        if (configRecord && configRecord.pb_image_url) {
          const parsed = JSON.parse(configRecord.pb_image_url);
          emailConfig = { ...emailConfig, ...parsed };
        }
      } catch (dbErr) {
        console.warn('Failed to load email config from DB, using fallback', dbErr);
      }

      const recipientTo = to || emailConfig.toEmail || 'takishita@kashiwa-f.com';
      const senderUser = emailConfig.user;
      const senderPass = emailConfig.pass;
      const smtpHost = emailConfig.host;
      const smtpPort = Number(emailConfig.port) || 587;
      const senderFrom = emailConfig.from || senderUser;

      if (!smtpHost || !senderUser || !senderPass) {
        return res.status(400).json({ 
          success: false, 
          error: 'SMTP設定が正しく登録されていません。管理者画面（DataViewerModal）の「メール送信設定」タブからSMTP情報を登録してください。' 
        });
      }

      // Nodemailer トランスポート作成
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: senderUser,
          pass: senderPass
        }
      });

      // 添付ファイルの準備
      const attachments = [];
      if (pdfBase64) {
        attachments.push({
          filename: filename || 'order.pdf',
          content: Buffer.from(pdfBase64, 'base64')
        });
      }

      // メール送信実行
      const info = await transporter.sendMail({
        from: `"${senderFrom}" <${senderUser}>`,
        to: recipientTo,
        subject: subject || '注文書送付依頼書',
        text: text,
        attachments: attachments
      });

      console.log('Message sent: %s', info.messageId);
      res.json({ success: true, messageId: info.messageId });

    } catch (error: any) {
      console.error('Error sending mail:', error);
      res.status(500).json({ success: false, error: error.message || 'メール送信中にエラーが発生しました。' });
    }
  });

  // Vite ミドルウェアのマウント (開発時)
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  app.use(vite.middlewares);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
