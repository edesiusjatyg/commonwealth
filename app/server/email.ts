"use server";

import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const COMPANY_EMAIL = process.env.COMPANY_EMAIL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

/**
 * Send an approval email to an emergency contact
 */
export async function sendApprovalEmail(
    to: string,
    walletName: string,
    approvalLink: string
): Promise<boolean> {
    if (!SMTP_HOST || !SMTP_USER) {
        console.warn("SMTP not configured, skipping email send");
        console.log(`[MOCK EMAIL] To: ${to}, Link: ${approvalLink}`);
        return true; // Return true to allow testing without SMTP
    }

    try {
        await transporter.sendMail({
            from: `"CommonWealth Security" <${COMPANY_EMAIL}>`,
            to,
            subject: `Action Required: Approve Daily Limit Override for ${walletName}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Daily Limit Override Request</h2>
          <p>The owner of wallet <strong>${walletName}</strong> has requested to override their daily spending limit.</p>
          <p>If you recognize this request and trust the user, please click the button below to approve it:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${approvalLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Approve Override</a>
          </p>
          <p>If you did not expect this request, please ignore this email or contact the wallet owner immediately.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">CommonWealth Security Team</p>
        </div>
      `,
        });
        return true;
    } catch (error) {
        console.error("Failed to send approval email:", error);
        return false;
    }
}
