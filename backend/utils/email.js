import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@neuralexam.com';

/**
 * Send simulated or actual email notifications
 */
export const sendEmailNotification = async ({ to, subject, html, text }) => {
  const isSmtpConfigured = SMTP_HOST && SMTP_USER && SMTP_PASS;

  if (isSmtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      });

      const info = await transporter.sendMail({
        from: `"Neural Exam Portal" <${SMTP_FROM}>`,
        to,
        subject,
        text,
        html
      });

      console.log(`✉️ Email successfully dispatched to <${to}>. Message ID: ${info.messageId}`);
      return { sent: true, mode: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error(`❌ SMTP dispatch failed, reverting to simulation:`, err.message);
    }
  }

  // Fallback Simulation Mode
  console.log(`
========================================================================
✉️  SIMULATED EMAIL NOTIFICATION DISPATCHED
========================================================================
From: Neural Exam Portal <${SMTP_FROM}>
To: <${to}>
Subject: ${subject}
------------------------------------------------------------------------
Text Content:
${text || 'HTML content only.'}
------------------------------------------------------------------------
HTML Preview:
${html.replace(/<[^>]*>/g, ' ').substring(0, 300)}...
========================================================================
  `);

  return { sent: true, mode: 'simulation' };
};

/**
 * Dispatch Exam Grade Release email to student
 */
export const sendResultEmail = async (userEmail, userName, examTitle, score, maxScore, isPassed) => {
  const scorePercent = Math.round((score / maxScore) * 100);
  const statusString = isPassed ? 'PASSED' : 'NOT PASSED';
  
  const text = `Hello ${userName},\n\nYour grades for the exam "${examTitle}" have been evaluated.\n\nScore: ${score} / ${maxScore} (${scorePercent}%)\nResult: ${statusString}\n\nLog in to the portal to review the detailed AI feedback and correct answers.\n\nBest regards,\nNeural Exam Portal Team`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #1f2937; border-radius: 8px; background-color: #0b0f19; color: #f3f4f6;">
      <h2 style="color: #00e5ff; font-size: 20px; border-bottom: 1px solid #1f2937; padding-bottom: 10px;">🏆 Evaluation Published</h2>
      <p style="font-size: 15px;">Hello <strong>${userName}</strong>,</p>
      <p style="font-size: 15px;">Your performance report has been successfully processed by the Gemini AI evaluator engine.</p>
      <div style="background-color: rgba(255,255,255,0.02); border: 1px solid #1f2937; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0; font-size: 14px;"><strong>Exam:</strong> ${examTitle}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Score:</strong> <span style="color: ${isPassed ? '#10b981' : '#ef4444'}; font-weight: bold;">${score} / ${maxScore} (${scorePercent}%)</span></p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Status:</strong> <span style="background-color: ${isPassed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${isPassed ? '#10b981' : '#ef4444'}; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: bold; border: 1px solid ${isPassed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'};">${statusString}</span></p>
      </div>
      <p style="font-size: 14px; color: #9ca3af;">Please access the student portal to review correct answers and your personalized cognitive study roadmap.</p>
      <footer style="margin-top: 30px; border-top: 1px solid #1f2937; padding-top: 15px; font-size: 12px; color: #4b5563; text-align: center;">
        © 2026 Neural Exam Proctored Space. All rights reserved.
      </footer>
    </div>
  `;

  return sendEmailNotification({
    to: userEmail,
    subject: `[Grades Published] ${examTitle} Result: ${scorePercent}%`,
    text,
    html
  });
};

/**
 * Dispatch welcome email to registered user
 */
export const sendWelcomeEmail = async (userEmail, userName, role) => {
  const text = `Hello ${userName},\n\nWelcome to Neural Exam Portal!\n\nYour profile has been created successfully as a ${role}.\n\nLog in to begin accessing or configuring exam chambers.\n\nBest regards,\nNeural Exam Portal Team`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #1f2937; border-radius: 8px; background-color: #0b0f19; color: #f3f4f6;">
      <h2 style="color: #bd00ff; font-size: 20px; border-bottom: 1px solid #1f2937; padding-bottom: 10px;">✨ Profile Signature Registered</h2>
      <p style="font-size: 15px;">Hello <strong>${userName}</strong>,</p>
      <p style="font-size: 15px;">Welcome to the Neural Exam system. Your candidate signature has been mapped to our registry.</p>
      <div style="background-color: rgba(255,255,255,0.02); border: 1px solid #1f2937; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0; font-size: 14px;"><strong>Account Name:</strong> ${userName}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Registry Role:</strong> <span style="color: #bd00ff; font-weight: bold; text-transform: uppercase;">${role}</span></p>
      </div>
      <p style="font-size: 14px; color: #9ca3af;">Get ready to enter the examination workspace or design proctored assessments.</p>
      <footer style="margin-top: 30px; border-top: 1px solid #1f2937; padding-top: 15px; font-size: 12px; color: #4b5563; text-align: center;">
        © 2026 Neural Exam Proctored Space. All rights reserved.
      </footer>
    </div>
  `;

  return sendEmailNotification({
    to: userEmail,
    subject: `Welcome to Neural Exam System, ${userName}!`,
    text,
    html
  });
};
