import 'dotenv/config';
import mongoose from 'mongoose';
import { EmailTemplate } from '../models';
import logger from '../utils/logger';

/**
 * One row per templateType referenced by sendEmail() across the controllers.
 * Body is an HTML fragment — config/mailer.ts wraps it in the ConstroBID
 * shell (header, footer) and derives the plain-text alternative from it.
 * Run with: npx ts-node src/scripts/seedEmailTemplates.ts
 */
const templates = [
  {
    type: 'REGISTRATION_OTP',
    subject: 'Your ConstroBID verification code: {{otp}}',
    body: `<p>Hi,</p>
<p>Your ConstroBID verification code is:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#70153a;">{{otp}}</p>
<p>This code expires in {{minutes}} minutes. Do not share it with anyone.</p>
<p>If you did not request this, you can safely ignore this email.</p>`,
  },
  {
    type: 'REGISTRATION',
    subject: 'Welcome to ConstroBID, {{name}}',
    body: `<p>Hi {{name}},</p>
<p>Your ConstroBID account is ready. You can now create a project, review inspection reports, and compare contractor quotations from one dashboard.</p>
<p>If you did not create this account, please ignore this email.</p>`,
  },
  {
    type: 'INSPECTION_SCHEDULED',
    subject: 'Site inspection scheduled — {{projectTitle}}',
    body: `<p>Dear {{clientName}},</p>
<p>Your site inspection for <strong>{{projectTitle}}</strong> has been scheduled successfully.</p>
<p><strong>Inspection Details</strong></p>
<p>
📅 Date: {{scheduledDate}}<br>
🕐 Time: {{startTime}} – {{endTime}}<br>
📍 Location: {{projectAddress}}
</p>
<p>Our ConstroBID team will visit the site to understand your requirements and assess:</p>
<ul>
<li>Site measurements</li>
<li>Actual area / square feet</li>
<li>Site condition</li>
<li>Required work</li>
<li>Material requirements</li>
<li>Other project-specific requirements</li>
</ul>
<p>Please ensure that someone is available at the property during the scheduled time.</p>
<p>After the inspection, our team will prepare the Inspection Report, followed by the Design and BOQ for your review.</p>
<p>If you need to reschedule the inspection, please contact our support team.</p>
<p>Regards,<br>
ConstroBID Team<br>
<span style="color:#efc975;font-weight:600;">Build. Renovate. Transform.</span></p>`,
  },
  {
    type: 'INSPECTION_RESCHEDULED',
    subject: 'ConstroBID – Your Site Inspection Has Been Rescheduled',
    body: `<p>Dear {{clientName}},</p>
<p>Your site inspection for <strong>{{projectTitle}}</strong> has been rescheduled.</p>
<p><strong>Updated Inspection Details</strong></p>
<p>
📅 New Date: {{scheduledDate}}<br>
🕐 New Time: {{startTime}} – {{endTime}}<br>
📍 Site Location: {{projectAddress}}
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:12px 0;border-collapse:collapse;">
  <tr>
    <td style="padding:10px 14px;background:#faf7f8;border-left:3px solid #cbb;color:#6b7280;font-size:13px;">
      Previous: {{previousDate}}, {{previousTime}}
    </td>
  </tr>
  <tr>
    <td style="padding:10px 14px;background:#faf7f8;border-left:3px solid #70153a;color:#1f2937;font-size:13px;font-weight:600;">
      New: {{scheduledDate}}, {{startTime}}
    </td>
  </tr>
</table>
<p>Our ConstroBID team will visit the site to understand your requirements and assess the project, including site conditions, measurements, required work, and material requirements.</p>
<p>Please ensure that someone is available at the property during the scheduled time.</p>
<p>If you have any questions regarding the updated schedule, please contact the ConstroBID team.</p>
<p>Regards,<br>
ConstroBID Team<br>
<span style="color:#efc975;font-weight:600;">Build. Renovate. Transform.</span></p>`,
  },
  {
    type: 'INSPECTION_COMPLETED',
    subject: 'ConstroBID – Site Inspection Completed',
    body: `<p>Dear {{clientName}},</p>
<p>The site inspection for <strong>{{projectTitle}}</strong> has been successfully completed.</p>
<p>Our ConstroBID team has visited the site and recorded the required information for your project.</p>
<p><strong>Inspection Completed</strong></p>
<p>
📍 Project: {{projectTitle}}<br>
📅 Inspection Date: {{inspectionDate}}<br>
📍 Location: {{projectAddress}}
</p>
<p>The inspection information may include:</p>
<ul>
<li>Site measurements</li>
<li>Actual square footage</li>
<li>Site condition</li>
<li>Required work</li>
<li>Material requirements</li>
<li>Site photographs</li>
<li>Inspection notes</li>
</ul>
<p>The ConstroBID team will now proceed with the Design and BOQ preparation for your project.</p>
<p>You can track the progress of your project from your ConstroBID dashboard.</p>
<p>Regards,<br>
ConstroBID Team<br>
<span style="color:#efc975;font-weight:600;">Build. Renovate. Transform.</span></p>`,
  },
  {
    type: 'DESIGN_SUBMITTED',
    subject: 'Your design is ready — {{projectTitle}}',
    body: `<p>Hi,</p>
<p>{{message}}</p>
<p>Project: <strong>{{projectTitle}}</strong></p>
<p>Log in to review and approve the design so bidding can open.</p>`,
  },
  {
    type: 'CLIENT_REQUESTED_CHANGES',
    subject: 'Design changes requested — {{projectTitle}}',
    body: `<p>Hi,</p>
<p>The client requested changes on <strong>{{projectTitle}}</strong>:</p>
<p style="background:#faf7f8;border-left:3px solid #70153a;padding:10px 14px;">{{notes}}</p>`,
  },
  {
    type: 'PROJECT_APPROVED',
    subject: 'Design approved — {{projectTitle}}',
    body: `<p>Hi,</p>
<p>The client approved the design for <strong>{{projectTitle}}</strong>. The project is now ready to move to contractor bidding.</p>`,
  },
  {
    type: 'PROJECT_PUBLISHED',
    subject: 'New project open for bidding — {{projectTitle}}',
    body: `<p>Hi {{companyName}},</p>
<p>A new project matching your service area is open for bidding:</p>
<p><strong>{{projectTitle}}</strong> — {{city}}</p>
<p>Log in to review the design, BOQ, and submit your quotation before the deadline.</p>`,
  },
  {
    type: 'QUOTATION_RECEIVED',
    subject: 'New quotation received — {{projectTitle}}',
    body: `<p>Hi {{clientName}},</p>
<p>A contractor submitted a new quotation for <strong>{{projectTitle}}</strong>. Log in to compare quotations.</p>`,
  },
  {
    type: 'CONTRACTOR_SELECTED',
    subject: "You've been selected — {{projectTitle}}",
    body: `<p>Hi {{companyName}},</p>
<p>Congratulations — your quotation for <strong>{{projectTitle}}</strong> has been selected by the client.</p>
<p>Log in to confirm the contract and get started.</p>`,
  },
  {
    type: 'WORK_STARTED',
    subject: 'Work has started — {{projectTitle}}',
    body: `<p>Hi {{clientName}},</p>
<p>Work has officially started on <strong>{{projectTitle}}</strong>. You can track progress from your dashboard.</p>`,
  },
  {
    type: 'COMPLETION_VERIFICATION',
    subject: 'Verify project completion — {{projectTitle}}',
    body: `<p>Hi {{clientName}},</p>
<p>The contractor has marked <strong>{{projectTitle}}</strong> as complete. Please review and verify the handover.</p>`,
  },
  {
    type: 'PROJECT_COMPLETED',
    subject: 'Project completed — {{projectTitle}}',
    body: `<p>Hi {{clientName}},</p>
<p><strong>{{projectTitle}}</strong> has been marked complete. Thank you for building with ConstroBID — we'd love your review.</p>`,
  },
  {
    type: 'CONTRACTOR_APPROVAL',
    subject: 'Your contractor application is approved',
    body: `<p>Hi {{ownerName}},</p>
<p>Congratulations — <strong>{{companyName}}</strong> has been verified on ConstroBID. You can now browse open projects and submit quotations.</p>`,
  },
  {
    type: 'CONTRACTOR_REJECTION',
    subject: 'Update on your contractor application',
    body: `<p>Hi,</p>
<p>Thank you for applying to ConstroBID as <strong>{{companyName}}</strong>. Unfortunately your application was not approved at this time.</p>
<p>Reason: {{reason}}</p>`,
  },
  {
    type: 'CONTRACTOR_REQUEST_DOCUMENTS',
    subject: 'Additional documents required — {{companyName}}',
    body: `<p>Hi,</p>
<p>To continue verifying <strong>{{companyName}}</strong>, we need a few more documents:</p>
<p style="background:#faf7f8;border-left:3px solid #70153a;padding:10px 14px;">{{message}}</p>`,
  },
  {
    type: 'SUPPORT_MESSAGE_RECEIVED',
    subject: 'New support message — {{fromEmail}}',
    body: `<p>A visitor sent a message through the website.</p>
<p><strong>Name:</strong> {{fromName}}<br>
<strong>Phone:</strong> {{fromPhone}}<br>
<strong>Email:</strong> {{fromEmail}}</p>
<p style="background:#faf7f8;border-left:3px solid #70153a;padding:10px 14px;white-space:pre-wrap;">{{message}}</p>
<p>Reply directly to their email to respond.</p>`,
  },
  {
    type: 'SUPPORT_MESSAGE_CONFIRMATION',
    subject: "We've received your message",
    body: `<p>Hi,</p>
<p>Thanks for reaching out to ConstroBID. We've received your message:</p>
<p style="background:#faf7f8;border-left:3px solid #70153a;padding:10px 14px;white-space:pre-wrap;">{{message}}</p>
<p>Our team usually replies within one business day.</p>`,
  },
  {
    type: 'CONTRACTOR_DECLINED',
    subject: 'Contractor declined — {{projectTitle}}',
    body: `<p>Hi {{clientName}},</p>
<p><strong>{{companyName}}</strong> was unable to take on <strong>{{projectTitle}}</strong> and has declined the project.</p>
<p style="background:#faf7f8;border-left:3px solid #70153a;padding:10px 14px;">{{reason}}</p>
<p>{{nextStep}}</p>`,
  },
  {
    type: 'BID_NOT_SELECTED',
    subject: 'Project awarded to another contractor — {{projectTitle}}',
    body: `<p>Hi {{companyName}},</p>
<p>The client has selected another contractor for <strong>{{projectTitle}}</strong>. Thank you for your quotation — keep an eye on your dashboard for new open projects to bid on.</p>`,
  },
  {
    type: 'REQUOTE_REQUESTED',
    subject: 'Revised quotation requested — {{projectTitle}}',
    body: `<p>Hi {{companyName}},</p>
<p>The inspection team has asked you to revise your quotation for <strong>{{projectTitle}}</strong>.</p>
<p style="background:#faf7f8;border-left:3px solid #70153a;padding:10px 14px;">{{remarks}}</p>
<p>Log in and submit your updated quotation before the bidding deadline.</p>`,
  },
  {
    type: 'PROJECT_COMPLETED_CONTRACTOR',
    subject: 'Handover approved — {{projectTitle}}',
    body: `<p>Hi {{companyName}},</p>
<p>The inspection team has approved the final handover for <strong>{{projectTitle}}</strong>. The project is now marked complete. Thank you for building with ConstroBID.</p>`,
  },
  {
    type: 'NEW_MESSAGE_CLIENT',
    subject: 'New message on {{projectTitle}}',
    body: `<p>Hi {{clientName}},</p>
<p>You have a new message on <strong>{{projectTitle}}</strong>:</p>
<p style="background:#faf7f8;border-left:3px solid #70153a;padding:10px 14px;">{{preview}}</p>
<p>Log in to reply.</p>`,
  },
  {
    type: 'BIDDING_REOPENED',
    subject: 'Bidding reopened — {{projectTitle}}',
    body: `<p>Hi {{clientName}},</p>
<p>Our inspection team has reopened bidding for <strong>{{projectTitle}}</strong> to bring in new contractor quotations.</p>
<p style="background:#faf7f8;border-left:3px solid #70153a;padding:10px 14px;">New bidding deadline: <strong>{{deadlineDate}} at {{deadlineTime}}</strong></p>
<p>We'll notify you as soon as new quotations come in.</p>`,
  },
  {
    type: 'BIDDING_REOPENED_CONTRACTOR',
    subject: 'Bidding reopened — {{projectTitle}}',
    body: `<p>Hi {{companyName}},</p>
<p>Bidding has reopened for <strong>{{projectTitle}}</strong>. You're welcome to submit or revise your quotation before the new deadline.</p>
<p style="background:#faf7f8;border-left:3px solid #70153a;padding:10px 14px;">New bidding deadline: <strong>{{deadlineDate}} at {{deadlineTime}}</strong></p>
<p>Log in to your dashboard to view the project.</p>`,
  },
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error('MONGODB_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(uri);

  let created = 0;
  let updated = 0;
  for (const t of templates) {
    const res = await EmailTemplate.updateOne(
      { type: t.type },
      { $set: { subject: t.subject, body: t.body } },
      { upsert: true }
    );
    if (res.upsertedCount) created++;
    else updated++;
  }

  logger.info('Email templates seeded', { created, updated, total: templates.length });
  console.log(`Seeded ${templates.length} templates (${created} created, ${updated} updated).`);
  await mongoose.disconnect();
}

run().catch((error) => {
  logger.error('seedEmailTemplates failed', { error: (error as any)?.message });
  process.exit(1);
});
