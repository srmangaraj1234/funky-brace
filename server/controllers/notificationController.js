// Notification Controller
// Dispatches email alerts when admin marks issue as resolved

import { sendEmail } from '../services/resendService.js';

export async function dispatchResolutionEmail(req, res) {
  try {
    const { issueId, citizenEmail, issueTitle, adminNotes } = req.body;
    
    if (!citizenEmail) {
      return res.status(400).json({ status: 'error', message: 'Missing citizenEmail' });
    }
    if (!issueTitle) {
      return res.status(400).json({ status: 'error', message: 'Missing issueTitle' });
    }

    console.log(`Dispatching resolution alert to ${citizenEmail} for issue: ${issueTitle}`);
    
    const resolvedTimestamp = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'long',
      timeStyle: 'medium',
    }) + ' UTC';

    // Elegant, highly polished HTML Email Template matching the FixMyCity professional theme
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #1e3a8a; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">FixMyCity</h1>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0; font-weight: 500;">Civic Resolution Update</p>
        </div>
        
        <div style="padding: 10px 0;">
          <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; font-weight: 700;">Great news! Your reported issue has been resolved.</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hello,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Thank you for contributing to your community. The municipal team has reviewed, addressed, and successfully resolved the issue you reported.</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px 8px 8px 4px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; font-size: 14px; font-weight: bold; color: #475569; width: 130px;">Issue ID:</td>
                <td style="padding: 4px 0; font-size: 14px; color: #0f172a; font-family: monospace;">${issueId || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-size: 14px; font-weight: bold; color: #475569;">Issue Title:</td>
                <td style="padding: 4px 0; font-size: 14px; color: #0f172a; font-weight: 600;">${issueTitle}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-size: 14px; font-weight: bold; color: #475569;">Resolved At:</td>
                <td style="padding: 4px 0; font-size: 14px; color: #0f172a;">${resolvedTimestamp}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-size: 14px; font-weight: bold; color: #475569; vertical-align: top;">Admin Update:</td>
                <td style="padding: 4px 0; font-size: 14px; color: #059669; font-weight: 600; line-height: 1.4;">${adminNotes || 'No notes provided.'}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Your active civic engagement helps make our city a cleaner, safer, and better place to live for everyone. Continue reporting and validating local issues on the FixMyCity platform.</p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated notification from FixMyCity.</p>
          <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0 0;">&copy; 2026 FixMyCity Municipal Services. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailResult = await sendEmail({
      to: citizenEmail,
      subject: `[Resolved] FixMyCity: ${issueTitle}`,
      html: htmlContent
    });

    res.json({
      status: 'success',
      message: 'Resolution notification email dispatched successfully',
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Error in dispatchResolutionEmail:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
}
