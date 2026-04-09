import cron from 'node-cron';
import BusPassApplication from '../models/BusPassApplication.js';
import { sendEmail } from './sendEmail.js';

// Run everyday at 8:00 AM
export const initCronJobs = () => {
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('Running daily expiry check...');
      
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7); // 7 days before expiry

      const expiringPasses = await BusPassApplication.find({
        status: 'Approved',
        validUntil: {
          $gte: today,
          $lte: nextWeek
        }
      }).populate('user', 'name email');

      for (const pass of expiringPasses) {
        if (!pass.user?.email) continue;
        
        try {
           await sendEmail({
              email: pass.user.email,
              subject: '⏰ Bus Pass Expiring Soon — Renew Now',
              html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 40px;text-align:center;">
  <div style="font-size:24px;font-weight:900;color:white;">🚌 TransitPass</div>
</td></tr>
<tr><td style="background:#FFFBEB;padding:16px 40px;text-align:center;border-bottom:1px solid #FDE68A;">
  <div style="font-size:24px;">⏰</div>
  <div style="font-size:17px;font-weight:800;color:#92400E;">Your Pass Expires Soon!</div>
</td></tr>
<tr><td style="padding:28px 40px;">
  <p style="font-size:14px;color:#374151;margin:0 0 16px;">Hello <strong>${pass.user.name}</strong>,</p>
  <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 20px;">Your bus pass <strong>${pass.generatedPassId}</strong> expires on <strong>${new Date(pass.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>. Please renew it to avoid interruption.</p>
  <table width="100%"><tr><td align="center">
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/user-dashboard" style="display:inline-block;background:#6366F1;color:white;text-decoration:none;padding:12px 28px;border-radius:9999px;font-weight:700;font-size:14px;">Renew My Pass</a>
  </td></tr></table>
</td></tr>
<tr><td style="background:#F8FAFC;padding:16px 40px;text-align:center;border-top:1px solid #E5E7EB;">
  <div style="font-size:11px;color:#9CA3AF;">© ${new Date().getFullYear()} TransitPass</div>
</td></tr>
</table></td></tr></table></body></html>`,
           });
        } catch (err) {
           console.error(`Failed to send expiry reminder to ${pass.user.email}`);
        }
      }
      
      // Mark expired
      const expiredPasses = await BusPassApplication.find({
         status: 'Approved',
         validUntil: { $lt: today }
      });
      
      for (const pass of expiredPasses) {
         pass.status = 'Expired';
         await pass.save();
      }
      
    } catch (error) {
       console.error('Error in cron job:', error.message);
    }
  });
};
