import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import BusPassApplication from '../models/BusPassApplication.js';
import { sendEmail } from '../utils/sendEmail.js';

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { applicationId, amount } = req.body;

    const application = await BusPassApplication.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.status !== 'Approved')
      return res.status(400).json({ message: 'Payment only allowed for approved applications' });

    // Check if already paid
    const existing = await Payment.findOne({ application: applicationId, status: 'Completed' });
    if (existing) return res.status(400).json({ message: 'Payment already completed for this application' });

    const options = {
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `receipt_${applicationId}`,
    };

    const order = await getRazorpay().orders.create(options);

    const payment = await Payment.create({
      user: req.user._id,
      application: applicationId,
      amount,
      razorpayOrderId: order.id,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay order error:', JSON.stringify(error));
    res.status(500).json({ message: error.error?.description || error.message });
  }
};

// @desc    Verify payment signature
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      await Payment.findByIdAndUpdate(paymentId, { status: 'Failed' });
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { razorpayPaymentId, razorpaySignature, status: 'Completed' },
      { new: true }
    ).populate({ path: 'application', populate: { path: 'user', select: 'name email' } });

    // Send Email 2: Payment confirmation + Email 3: Pass PDF
    try {
      const app = payment.application;
      const user = app.user;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      // Email 2 — Payment Successful
      await sendEmail({
        email: user.email,
        subject: '💳 Payment Successful — Your Pass is Now Active',
        html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;"><tr><td align="center" style="padding:0 10px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:28px 24px;text-align:center;">
  <div style="font-size:22px;font-weight:900;color:white;">🚌 TransitPass</div>
</td></tr>
<tr><td style="background:#ECFDF5;padding:16px 24px;text-align:center;border-bottom:1px solid #A7F3D0;">
  <div style="font-size:26px;">💳</div>
  <div style="font-size:18px;font-weight:800;color:#065F46;">Payment Successful!</div>
  <div style="color:#047857;font-size:13px;margin-top:4px;">Your bus pass is now active</div>
</td></tr>
<tr><td style="padding:24px;">
  <p style="font-size:15px;color:#374151;margin:0 0 14px;">Hello <strong>${user.name}</strong>,</p>
  <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 18px;">Your payment of <strong>₹${payment.amount}</strong> has been received. Your bus pass is now fully activated.</p>
  <div style="background:#F1F5F9;border-radius:10px;padding:14px 18px;margin-bottom:18px;">
    <table width="100%">
      <tr><td style="padding-bottom:8px;"><div style="font-size:10px;color:#94A3B8;font-weight:700;text-transform:uppercase;">Transaction ID</div><div style="font-size:13px;color:#0F172A;font-weight:600;">${razorpayPaymentId}</div></td></tr>
      <tr><td style="padding-bottom:8px;"><div style="font-size:10px;color:#94A3B8;font-weight:700;text-transform:uppercase;">Pass ID</div><div style="font-size:13px;color:#6366F1;font-weight:700;">${app.generatedPassId}</div></td></tr>
      <tr><td><div style="font-size:10px;color:#94A3B8;font-weight:700;text-transform:uppercase;">Amount Paid</div><div style="font-size:13px;color:#0F172A;font-weight:600;">₹${payment.amount}</div></td></tr>
    </table>
  </div>
  <p style="font-size:13px;color:#6B7280;margin:0 0 16px;">A separate email with your <strong>pass PDF attached</strong> has been sent to you. Check your inbox.</p>
</td></tr>
<tr><td style="background:#F8FAFC;padding:14px 24px;text-align:center;border-top:1px solid #E5E7EB;">
  <div style="font-size:11px;color:#9CA3AF;">© ${new Date().getFullYear()} TransitPass · Municipal Transit Authority</div>
</td></tr>
</table></td></tr></table></body></html>`,
      });

      // Email 3 — Pass PDF attachment
      const { default: PDFDocument } = await import('pdfkit');
      const QRCode = (await import('qrcode')).default;
      const pdfBuffer = await new Promise(async (resolve, reject) => {
        const W = 242, H = 420;
        const doc = new PDFDocument({ size: [W, H], margin: 0 });
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const qrBuf = await QRCode.toBuffer(`${frontendUrl}/verify/${app.generatedPassId}`);

        doc.rect(0, 0, W, H).fill('#FFFFFF');
        doc.rect(0, 0, W, 80).fill('#6366F1');
        doc.fillColor('white').fontSize(7).font('Helvetica').text('STUDENT BUS PASS', 14, 14, { width: W - 28, characterSpacing: 1 });
        doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text('TransitPass', 14, 26);
        doc.fillColor('rgba(255,255,255,0.75)').fontSize(7).font('Helvetica').text('Municipal Transit Authority', 14, 48);
        doc.rect(0, 80, W, 36).fill('#EEF2FF');
        doc.fillColor('#6366F1').fontSize(7).font('Helvetica').text('PASS ID', 14, 88, { characterSpacing: 0.8 });
        doc.fillColor('#1e1b4b').fontSize(13).font('Helvetica-Bold').text(app.generatedPassId, 14, 98);

        const fields = [
          ['NAME', app.name], ['ROUTE', app.route], ['COLLEGE', app.college],
          ['COURSE & YEAR', `${app.course} — ${app.year}`],
          ['PASS TYPE', `${app.passType} · ${app.passDuration || 'Monthly'}`],
          ['VALID FROM', new Date(app.validFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
          ['VALID UNTIL', new Date(app.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
        ];
        let y = 126;
        fields.forEach(([label, value]) => {
          doc.fillColor('#94A3B8').fontSize(6.5).font('Helvetica').text(label, 14, y, { characterSpacing: 0.6 });
          doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(value || '—', 14, y + 9, { width: W - 28, ellipsis: true });
          y += 28;
          doc.rect(14, y - 2, W - 28, 0.5).fill('#E2E8F0');
        });
        const qrSize = 90;
        doc.image(qrBuf, (W - qrSize) / 2, y + 8, { width: qrSize, height: qrSize });
        doc.fillColor('#94A3B8').fontSize(6.5).font('Helvetica').text('Scan to verify', 0, y + qrSize + 14, { align: 'center', width: W });
        doc.rect(0, H - 22, W, 22).fill('#F1F5F9');
        doc.fillColor('#94A3B8').fontSize(6).font('Helvetica').text(`Generated ${new Date().toLocaleDateString('en-IN')} · Official Pass`, 0, H - 14, { align: 'center', width: W });
        doc.end();
      });

      await sendEmail({
        email: user.email,
        subject: '📥 Your Bus Pass PDF — Download Attached',
        html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;"><tr><td align="center" style="padding:0 10px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:28px 24px;text-align:center;">
  <div style="font-size:22px;font-weight:900;color:white;">🚌 TransitPass</div>
</td></tr>
<tr><td style="background:#EFF6FF;padding:16px 24px;text-align:center;border-bottom:1px solid #BFDBFE;">
  <div style="font-size:26px;">📥</div>
  <div style="font-size:18px;font-weight:800;color:#1D4ED8;">Your Pass is Ready to Download</div>
  <div style="color:#2563EB;font-size:13px;margin-top:4px;">PDF attached to this email</div>
</td></tr>
<tr><td style="padding:24px;">
  <p style="font-size:15px;color:#374151;margin:0 0 14px;">Hello <strong>${user.name}</strong>,</p>
  <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 18px;">Your official bus pass PDF is <strong>attached to this email</strong>. Open the attachment to save it on your device.</p>
  <div style="background:#EFF6FF;border-left:4px solid #6366F1;border-radius:8px;padding:14px 18px;margin-bottom:18px;">
    <div style="font-size:11px;font-weight:700;color:#4338CA;text-transform:uppercase;margin-bottom:5px;">Pass Details</div>
    <div style="font-size:14px;color:#1e1b4b;font-weight:700;">${app.generatedPassId}</div>
    <div style="font-size:13px;color:#6B7280;margin-top:4px;">${app.route} · Valid until ${new Date(app.validUntil).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
  </div>
  <p style="font-size:12px;color:#9CA3AF;text-align:center;">📎 Open the attachment below to download your pass</p>
</td></tr>
<tr><td style="background:#F8FAFC;padding:14px 24px;text-align:center;border-top:1px solid #E5E7EB;">
  <div style="font-size:11px;color:#9CA3AF;">© ${new Date().getFullYear()} TransitPass · Municipal Transit Authority</div>
</td></tr>
</table></td></tr></table></body></html>`,
        attachments: [{
          filename: `BusPass_${app.generatedPassId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }],
      });
    } catch (emailErr) {
      console.error('Payment email failed:', emailErr);
    }

    res.json({ message: 'Payment verified successfully', payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payment history for current user
// @route   GET /api/payments/my
// @access  Private
export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id, status: 'Completed' })
      .populate('application', 'generatedPassId route passType validUntil')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
