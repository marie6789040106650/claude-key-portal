/**
 * 邮件发送工具
 * 使用 Nodemailer + SMTP
 */

import nodemailer from 'nodemailer'

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // 使用 STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * 发送邮件
 */
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@claude-key-portal.com',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })
}

/**
 * 生成邮件 HTML 内容
 */
export function generateEmailHtml(params: {
  title: string
  message: string
  data?: any
}): string {
  const { title, message, data } = params

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .message {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .data {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 14px;
      margin-top: 15px;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
  </div>
  <div class="content">
    <div class="message">
      <p>${message}</p>
      ${
        data
          ? `
      <div class="data">
        <strong>详细信息：</strong>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </div>
      `
          : ''
      }
    </div>
  </div>
  <div class="footer">
    <p>此邮件由 Claude Key Portal 自动发送，请勿回复</p>
    <p>© 2025 Claude Key Portal. All rights reserved.</p>
  </div>
</body>
</html>
  `
}
