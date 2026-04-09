import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  let transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log(`\n* Using Ethereal test email (EMAIL_USER not set in .env) *`);
  }

  const mailOptions = {
    from: `"TransitPass - Bus Pass System" <${process.env.EMAIL_USER || 'admin@transitpass.com'}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
    text: options.text || '',
    attachments: options.attachments || [],
    headers: {
      'X-Priority': '1',
      'X-Mailer': 'TransitPass Mailer',
      'Importance': 'high',
    },
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent to %s : %s', options.email, info.messageId);

  if (!process.env.EMAIL_USER) {
    console.log('Email Preview URL: %s\n', nodemailer.getTestMessageUrl(info));
  }
};
