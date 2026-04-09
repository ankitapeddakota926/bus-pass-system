import BusPassApplication from '../models/BusPassApplication.js';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { createNotification } from './notificationController.js';
import { logAction } from '../utils/auditLog.js';

// @desc    Apply for pass
// @route   POST /api/apply-pass
// @access  Private
export const createApplication = async (req, res) => {
  try {
    const { name, email, phone, college, course, year, address, route, age, gender, distanceKm, passDuration, areaType } = req.body;

    if (!name || !email || !phone || !college || !course || !year || !address || !route || !age || !gender || !distanceKm) {
      return res.status(400).json({ message: 'All form fields are required.' });
    }

    // APSRTC Eligibility Rules
    const ageNum = parseInt(age);
    const distNum = parseFloat(distanceKm);
    const maxDist = areaType === 'City' ? 22 : 20;

    if (distNum > maxDist) {
      return res.status(400).json({ message: `Distance exceeds the maximum allowed (${maxDist} km for ${areaType} area).` });
    }
    if (ageNum > 35) {
      return res.status(400).json({ message: 'Concessional passes are only available for students up to 35 years of age.' });
    }

    // Determine pass category
    let passCategory = 'Concessional';
    if ((gender === 'Male' && ageNum < 12) || (gender === 'Female' && ageNum < 18)) {
      passCategory = 'Free';
    }

    // Check if required files are uploaded
    if (!req.files || 
        !req.files['applicationForm'] || 
        !req.files['bonaFideCertificate'] || 
        !req.files['aadhaarCard'] || 
        !req.files['feeReceipt'] || 
        !req.files['photograph']) {
      return res.status(400).json({ message: 'All required documents must be uploaded.' });
    }

    const application = await BusPassApplication.create({
      user: req.user._id,
      name,
      email,
      phone,
      college,
      course,
      year,
      address,
      route,
      age: ageNum,
      gender,
      distanceKm: distNum,
      passDuration: passDuration || 'Monthly',
      passCategory,
      areaType: areaType || 'Mofussil',
      documents: {        applicationForm: req.files['applicationForm'][0].path,
        bonaFideCertificate: req.files['bonaFideCertificate'][0].path,
        aadhaarCard: req.files['aadhaarCard'][0].path,
        feeReceipt: req.files['feeReceipt'][0].path,
        photograph: req.files['photograph'][0].path,
        casteCertificate: req.files['casteCertificate'] ? req.files['casteCertificate'][0].path : undefined,
        previousIdCard: req.files['previousIdCard'] ? req.files['previousIdCard'][0].path : undefined,
      },
      status: 'Pending',
      passType: 'Student'
    });

    res.status(201).json({ 
      message: 'Application submitted successfully',
      application 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's applications
// @route   GET /api/applications/my
// @access  Private
export const getMyApplications = async (req, res) => {
  try {
    const applications = await BusPassApplication.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all applications (Admin) with search & filter
// @route   GET /api/applications
// @access  Private/Admin
export const getApplications = async (req, res) => {
  try {
    const { status, search, college, route } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (college) filter.college = { $regex: college, $options: 'i' };
    if (route) filter.route = { $regex: route, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { college: { $regex: search, $options: 'i' } },
        { generatedPassId: { $regex: search, $options: 'i' } },
      ];
    }
    const applications = await BusPassApplication.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Update application status (Admin)
// @route   PUT /api/applications/:id/status
// @access  Private/Admin
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const application = await BusPassApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;

    if (status === 'Approved') {
      // APSRTC Pass Duration Rules — set validity dates
      const validFrom = new Date();
      const validUntil = new Date();
      const duration = application.passDuration || 'Monthly';
      if (duration === 'Monthly') validUntil.setMonth(validUntil.getMonth() + 1);
      else if (duration === 'Quarterly') validUntil.setMonth(validUntil.getMonth() + 3);
      else if (duration === 'Annual') validUntil.setMonth(validUntil.getMonth() + 11);

      application.validFrom = validFrom;
      application.validUntil = validUntil;

      // Generate pass ID now, but QR/download only after payment
      const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
      application.generatedPassId = `BP-${new Date().getFullYear()}-${randomPart}`;
      application.rejectionReason = '';

      // Free pass category — skip payment
      if (application.passCategory === 'Free') {
        application.paymentStatus = 'Free';
        // Generate QR immediately for free pass holders
        try {
          const qrData = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${application.generatedPassId}`;
          const qrBuffer = await QRCode.toBuffer(qrData);
          const { cloudinary } = await import('../middleware/uploadMiddleware.js');
          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: 'bus-pass-qrcodes', public_id: `qr-${application.generatedPassId}`, resource_type: 'image' },
              (err, result) => err ? reject(err) : resolve(result)
            );
            stream.end(qrBuffer);
          });
          application.qrCode = uploadResult.secure_url;
        } catch (err) { console.error('QR Code Generation Failed:', err); }
      } else {
        // Concessional — payment required before QR is generated
        application.paymentStatus = 'Pending';
      }
    } else if (status === 'Rejected' || status === 'Correction') {
      if (!rejectionReason) {
         return res.status(400).json({ message: 'A rejection or correction reason is required.' });
      }
      application.rejectionReason = rejectionReason;
    }

    const updatedApplication = await application.save();
    
    // Explicitly populate user data on this model to reach their email safely for nodemailer
    await application.populate('user', 'name email');

    // Audit log
    await logAction(req, `APPLICATION_${status.toUpperCase()}`, 'Application', application._id, `${application.name} — ${application.route}`);

    // In-app notification
    const notifMap = {
      Approved: { title: '🎉 Pass Approved!', msg: `Your bus pass (${application.generatedPassId}) has been approved. Valid until ${new Date(application.validUntil).toLocaleDateString()}.`, type: 'success' },
      Rejected: { title: '❌ Pass Rejected', msg: `Your application was rejected. Reason: ${rejectionReason}`, type: 'danger' },
      Correction: { title: '⚠️ Correction Required', msg: `Your application needs correction: ${rejectionReason}`, type: 'warning' },
    };
    if (notifMap[status]) {
      await createNotification(application.user._id, notifMap[status].title, notifMap[status].msg, notifMap[status].type, '/user-dashboard');
    }

    // Email Triggers
    const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const pcUrl = `http://localhost:5173/user-dashboard`;
    const mobileUrl = `${dashboardUrl}/user-dashboard`;

    if (status === 'Approved') {
      // Email 1: Approval — NO download, only "Proceed to Payment" CTA
      const approvalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body{margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;}
  @media only screen and (max-width:600px){.body{padding:16px!important;}.btn{display:block!important;width:100%!important;box-sizing:border-box;margin-bottom:10px!important;}}
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:20px 0;">
<tr><td align="center" style="padding:0 10px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:28px 24px;text-align:center;">
    <div style="font-size:22px;font-weight:900;color:white;">🚌 TransitPass</div>
    <div style="color:rgba(255,255,255,0.8);font-size:12px;margin-top:4px;">Municipal Transit Authority</div>
  </td></tr>
  <tr><td style="background:#ECFDF5;padding:16px 24px;text-align:center;border-bottom:1px solid #A7F3D0;">
    <div style="font-size:26px;">✅</div>
    <div style="font-size:18px;font-weight:800;color:#065F46;">Application Approved!</div>
    <div style="color:#047857;font-size:13px;margin-top:4px;">Complete payment to activate your pass</div>
  </td></tr>
  <tr><td class="body" style="padding:24px;">
    <p style="font-size:15px;color:#374151;margin:0 0 14px;">Hello <strong>${application.user.name}</strong>,</p>
    <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 20px;">
      Great news! Your bus pass application has been <strong style="color:#059669;">approved</strong> by the admin.
      To activate your pass and receive the downloadable PDF, please <strong>complete the payment</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#6366F1,#8B5CF6);border-radius:12px;margin-bottom:20px;">
    <tr>
      <td style="padding:18px 20px;">
        <div style="color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Pass ID</div>
        <div style="color:white;font-size:18px;font-weight:900;margin:4px 0 12px;">${application.generatedPassId}</div>
        <table width="100%"><tr>
          <td><div style="color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;">Route</div><div style="color:white;font-size:13px;font-weight:600;margin-top:2px;">${application.route}</div></td>
          <td><div style="color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;">Valid Until</div><div style="color:white;font-size:13px;font-weight:600;margin-top:2px;">${new Date(application.validUntil).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div></td>
        </tr></table>
      </td>
    </tr>
    </table>
    <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
      <div style="font-size:13px;color:#92400E;font-weight:700;">⚠️ Action Required</div>
      <div style="font-size:13px;color:#78350F;margin-top:4px;">Your pass will only be activated after payment. Please proceed to pay ₹1 to download your pass.</div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:10px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/user-dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:white;text-decoration:none;padding:13px 32px;border-radius:9999px;font-weight:700;font-size:14px;box-shadow:0 4px 14px rgba(99,102,241,0.4);">
          💳 Proceed to Payment
        </a>
      </td></tr>
      <tr><td align="center"><span style="font-size:11px;color:#9CA3AF;">Go to Dashboard → Payments tab to complete payment</span></td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#F8FAFC;padding:14px 24px;text-align:center;border-top:1px solid #E5E7EB;">
    <div style="font-size:11px;color:#9CA3AF;">© ${new Date().getFullYear()} TransitPass · Municipal Transit Authority</div>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

      try {
        await sendEmail({
          email: application.user.email,
          subject: '✅ Pass Approved — Complete Payment to Download',
          html: approvalHtml,
        });
      } catch (err) { console.error('Approval email failed:', err); }

    } else if (status === 'Rejected') {
      const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:36px 40px;text-align:center;">
  <div style="font-size:26px;font-weight:900;color:white;">🚌 TransitPass</div>
</td></tr>
<tr><td style="background:#FEF2F2;padding:18px 40px;text-align:center;border-bottom:1px solid #FECACA;">
  <div style="font-size:28px;">❌</div>
  <div style="font-size:19px;font-weight:800;color:#991B1B;">Application Rejected</div>
</td></tr>
<tr><td style="padding:32px 40px;">
  <p style="font-size:15px;color:#374151;margin:0 0 20px;">Hello <strong>${application.user.name}</strong>,</p>
  <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 20px;">Your bus pass application has been <strong style="color:#DC2626;">rejected</strong> after review.</p>
  <div style="background:#FEF2F2;border-left:4px solid #EF4444;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
    <div style="font-size:11px;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:5px;">Reason for Rejection</div>
    <div style="font-size:14px;color:#7F1D1D;font-weight:500;">${rejectionReason}</div>
  </div>
  <p style="font-size:13px;color:#6B7280;line-height:1.7;margin:0 0 22px;">You may reapply after addressing the above issue.</p>
  <table width="100%"><tr><td align="center">
    <a href="${dashboardUrl}/user-dashboard" style="display:inline-block;background:#6366F1;color:white;text-decoration:none;padding:12px 28px;border-radius:9999px;font-weight:700;font-size:14px;">Go to Dashboard</a>
  </td></tr></table>
</td></tr>
<tr><td style="background:#F8FAFC;padding:18px 40px;text-align:center;border-top:1px solid #E5E7EB;">
  <div style="font-size:11px;color:#9CA3AF;">© ${new Date().getFullYear()} TransitPass · Municipal Transit Authority</div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
      try {
        await sendEmail({ email: application.user.email, subject: '❌ Bus Pass Application Rejected', html });
      } catch (err) { console.error('Rejection email failed:', err); }

    } else if (status === 'Correction') {
      const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:36px 40px;text-align:center;">
  <div style="font-size:26px;font-weight:900;color:white;">🚌 TransitPass</div>
</td></tr>
<tr><td style="background:#FFFBEB;padding:18px 40px;text-align:center;border-bottom:1px solid #FDE68A;">
  <div style="font-size:28px;">⚠️</div>
  <div style="font-size:19px;font-weight:800;color:#92400E;">Correction Required</div>
</td></tr>
<tr><td style="padding:32px 40px;">
  <p style="font-size:15px;color:#374151;margin:0 0 20px;">Hello <strong>${application.user.name}</strong>,</p>
  <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 20px;">Your application needs some corrections before it can be approved.</p>
  <div style="background:#FFFBEB;border-left:4px solid #F59E0B;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
    <div style="font-size:11px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:5px;">Action Required</div>
    <div style="font-size:14px;color:#78350F;font-weight:500;">${rejectionReason}</div>
  </div>
  <p style="font-size:13px;color:#6B7280;line-height:1.7;margin:0 0 22px;">Please log in, make the corrections, and resubmit your application.</p>
  <table width="100%"><tr><td align="center">
    <a href="${dashboardUrl}/user-dashboard" style="display:inline-block;background:#6366F1;color:white;text-decoration:none;padding:12px 28px;border-radius:9999px;font-weight:700;font-size:14px;">Fix &amp; Resubmit</a>
  </td></tr></table>
</td></tr>
<tr><td style="background:#F8FAFC;padding:18px 40px;text-align:center;border-top:1px solid #E5E7EB;">
  <div style="font-size:11px;color:#9CA3AF;">© ${new Date().getFullYear()} TransitPass · Municipal Transit Authority</div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
      try {
        await sendEmail({ email: application.user.email, subject: '⚠️ Bus Pass Application - Correction Required', html });
      } catch (err) { console.error('Correction email failed:', err); }
    }

    res.json({ 
      message: 'Notification email sent to the student successfully.',
      updatedApplication 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Renew an existing application
// @route   POST /api/applications/renew/:id
// @access  Private
export const renewApplication = async (req, res) => {
  try {
    const oldApp = await BusPassApplication.findById(req.params.id);
    if (!oldApp) return res.status(404).json({ message: 'Previous application not found.' });

    const newApp = await BusPassApplication.create({
      user: req.user._id,
      name: oldApp.name,
      email: oldApp.email,
      phone: oldApp.phone,
      college: oldApp.college,
      course: oldApp.course,
      year: oldApp.year,
      address: oldApp.address,
      route: oldApp.route,
      documents: oldApp.documents, // Reuse verified documents
      status: 'Pending',
      passType: oldApp.passType
    });

    res.status(201).json({ message: 'Pass Renewal application submitted successfully.', application: newApp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download pass as PDF
// @route   GET /api/applications/:id/download-pass
// @access  Private
export const downloadPass = async (req, res) => {
  try {
    const application = await BusPassApplication.findById(req.params.id);

    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.status !== 'Approved') return res.status(400).json({ message: 'Pass not approved yet' });
    if (application.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });

    const qrBuffer = await QRCode.toBuffer(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify/${application.generatedPassId}`
    );

    // Card dimensions: 85.6mm x 200mm (like a tall ID card)
    const W = 242; // ~85.6mm in points
    const H = 420; // compact card height
    const doc = new PDFDocument({ size: [W, H], margin: 0 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=BusPass_${application.generatedPassId}.pdf`);
    doc.pipe(res);

    // ── Background ──
    doc.rect(0, 0, W, H).fill('#FFFFFF');

    // ── Header gradient band ──
    doc.rect(0, 0, W, 80).fill('#6366F1');

    // ── Header text ──
    doc.fillColor('white').fontSize(7).font('Helvetica').text('STUDENT BUS PASS', 14, 14, { width: W - 28, align: 'left', characterSpacing: 1 });
    doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text('TransitPass', 14, 26);
    doc.fillColor('rgba(255,255,255,0.75)').fontSize(7).font('Helvetica').text('Municipal Transit Authority', 14, 48);

    // ── Pass ID band ──
    doc.rect(0, 80, W, 36).fill('#EEF2FF');
    doc.fillColor('#6366F1').fontSize(7).font('Helvetica').text('PASS ID', 14, 88, { characterSpacing: 0.8 });
    doc.fillColor('#1e1b4b').fontSize(13).font('Helvetica-Bold').text(application.generatedPassId, 14, 98);

    // ── Details ──
    const fields = [
      ['NAME', application.name],
      ['ROUTE', application.route],
      ['COLLEGE', application.college],
      ['COURSE & YEAR', `${application.course} — ${application.year}`],
      ['PASS TYPE', `${application.passType} · ${application.passDuration || 'Monthly'}`],
      ['VALID FROM', new Date(application.validFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
      ['VALID UNTIL', new Date(application.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
    ];

    let y = 126;
    fields.forEach(([label, value]) => {
      doc.fillColor('#94A3B8').fontSize(6.5).font('Helvetica').text(label, 14, y, { characterSpacing: 0.6 });
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(value || '—', 14, y + 9, { width: W - 28, ellipsis: true });
      y += 28;
      doc.rect(14, y - 2, W - 28, 0.5).fill('#E2E8F0');
    });

    // ── QR Code ──
    const qrSize = 90;
    const qrX = (W - qrSize) / 2;
    doc.image(qrBuffer, qrX, y + 8, { width: qrSize, height: qrSize });
    doc.fillColor('#94A3B8').fontSize(6.5).font('Helvetica').text('Scan to verify', 0, y + qrSize + 14, { align: 'center', width: W });

    // ── Footer ──
    doc.rect(0, H - 22, W, 22).fill('#F1F5F9');
    doc.fillColor('#94A3B8').fontSize(6).font('Helvetica')
      .text(`Generated ${new Date().toLocaleDateString('en-IN')} · Official Pass`, 0, H - 14, { align: 'center', width: W });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export applications as CSV
// @route   GET /api/applications/export
// @access  Private/Admin
export const exportApplications = async (req, res) => {
  try {
    const { default: XLSX } = await import('xlsx');
    const applications = await BusPassApplication.find({}).populate('user', 'name email phone').sort({ createdAt: -1 });

    const rows = applications.map(a => ({
      'Pass ID': a.generatedPassId || '',
      'Name': a.name,
      'Email': a.email,
      'Phone': a.phone,
      'College': a.college,
      'Course': a.course,
      'Year': a.year,
      'Route': a.route,
      'Pass Type': a.passType,
      'Status': a.status,
      'Valid From': a.validFrom ? new Date(a.validFrom).toLocaleDateString('en-IN') : '',
      'Valid Until': a.validUntil ? new Date(a.validUntil).toLocaleDateString('en-IN') : '',
      'Applied On': new Date(a.createdAt).toLocaleDateString('en-IN'),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Applications');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=applications.xlsx');
    res.send(buffer);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Extend pass validity (Admin)
// @route   PUT /api/applications/:id/extend
// @access  Private/Admin
export const extendValidity = async (req, res) => {
  try {
    const { days } = req.body;
    if (!days || days < 1) return res.status(400).json({ message: 'Please provide valid number of days' });

    const application = await BusPassApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.status !== 'Approved') return res.status(400).json({ message: 'Can only extend approved passes' });

    const currentExpiry = new Date(application.validUntil);
    currentExpiry.setDate(currentExpiry.getDate() + parseInt(days));
    application.validUntil = currentExpiry;
    await application.save();

    await application.populate('user', 'name email');
    try {
      await sendEmail({
        email: application.user.email,
        subject: '✅ Your Bus Pass Validity Has Been Extended',
        html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 40px;text-align:center;">
  <div style="font-size:24px;font-weight:900;color:white;">🚌 TransitPass</div>
</td></tr>
<tr><td style="padding:32px 40px;">
  <p style="font-size:15px;color:#374151;margin:0 0 16px;">Hello <strong>${application.user.name}</strong>,</p>
  <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 20px;">Your bus pass validity has been extended by <strong>${days} days</strong>.</p>
  <div style="background:#EEF2FF;border-left:4px solid #6366F1;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
    <div style="font-size:11px;font-weight:700;color:#4338CA;text-transform:uppercase;margin-bottom:5px;">New Expiry Date</div>
    <div style="font-size:16px;color:#1e1b4b;font-weight:700;">${new Date(application.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
</td></tr>
<tr><td style="background:#F8FAFC;padding:16px 40px;text-align:center;border-top:1px solid #E5E7EB;">
  <div style="font-size:11px;color:#9CA3AF;">© ${new Date().getFullYear()} TransitPass</div>
</td></tr>
</table></td></tr></table></body></html>`,
      });
    } catch (e) { console.error('Extension email failed:', e); }

    res.json({ message: `Pass extended by ${days} days`, application });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Bulk update application status (Admin)
// @route   PUT /api/applications/bulk-status
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status, rejectionReason } = req.body;
    if (!ids?.length) return res.status(400).json({ message: 'No IDs provided' });

    const results = [];
    for (const id of ids) {
      const application = await BusPassApplication.findById(id);
      if (!application) continue;
      application.status = status;
      if (status === 'Approved') {
        const validFrom = new Date();
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);
        application.validFrom = validFrom;
        application.validUntil = validUntil;
        const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
        application.generatedPassId = `BP-${new Date().getFullYear()}-${randomPart}`;
        application.rejectionReason = '';
        try {
          const qrBuffer = await QRCode.toBuffer(JSON.stringify({ passId: application.generatedPassId, name: application.name, route: application.route, validUntil: validUntil.toISOString().split('T')[0] }));
          const { cloudinary } = await import('../middleware/uploadMiddleware.js');
          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'bus-pass-qrcodes', public_id: `qr-${application.generatedPassId}`, resource_type: 'image' }, (err, result) => err ? reject(err) : resolve(result));
            stream.end(qrBuffer);
          });
          application.qrCode = uploadResult.secure_url;
        } catch (e) { console.error('QR failed for bulk:', e); }
      } else if (rejectionReason) {
        application.rejectionReason = rejectionReason;
      }
      await application.save();
      await application.populate('user', 'name email');
      await createNotification(application.user._id, status === 'Approved' ? '🎉 Pass Approved!' : '❌ Pass Rejected', status === 'Approved' ? `Your pass ${application.generatedPassId} is approved.` : `Your application was rejected. ${rejectionReason || ''}`, status === 'Approved' ? 'success' : 'danger');
      results.push(id);
    }
    await logAction(req, `BULK_${status.toUpperCase()}`, 'Application', null, `${results.length} applications`);
    res.json({ message: `${results.length} applications updated to ${status}` });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Blacklist/deactivate a pass
// @route   PUT /api/applications/:id/blacklist
export const blacklistPass = async (req, res) => {
  try {
    const application = await BusPassApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Not found' });
    application.status = 'Rejected';
    application.rejectionReason = req.body.reason || 'Pass deactivated by admin';
    await application.save();
    await application.populate('user', 'name email');
    await createNotification(application.user._id, '🚫 Pass Deactivated', `Your pass ${application.generatedPassId} has been deactivated. Reason: ${application.rejectionReason}`, 'danger');
    await logAction(req, 'BLACKLIST_PASS', 'Application', application._id, application.generatedPassId);
    res.json({ message: 'Pass blacklisted', application });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Verify pass by passId (public QR scan endpoint)
// @route   GET /api/applications/verify/:passId
// @access  Public
export const verifyPass = async (req, res) => {
  try {
    const application = await BusPassApplication.findOne({ generatedPassId: req.params.passId })
      .populate('user', 'name email phone');

    if (!application) return res.status(404).json({ message: 'Pass not found', valid: false });

    const now = new Date();
    const isExpired = application.validUntil && new Date(application.validUntil) < now;
    const isValid = application.status === 'Approved' && !isExpired;

    res.json({
      valid: isValid,
      status: isExpired ? 'Expired' : application.status,
      passId: application.generatedPassId,
      name: application.name,
      college: application.college,
      course: application.course,
      year: application.year,
      route: application.route,
      passType: application.passType,
      validFrom: application.validFrom,
      validUntil: application.validUntil,
      phone: application.phone,
      qrCode: application.qrCode,
    });
  } catch (error) { res.status(500).json({ message: error.message, valid: false }); }
};
