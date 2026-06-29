import nodemailer from "nodemailer";

const getTransporter = () => {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
        throw new Error("Email service is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.");
    }

    const port = Number(process.env.SMTP_PORT || 587);
    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
};

export const sendVerificationOtp = async (email: string, code: string) => {
    const transporter = getTransporter();
    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: "Verify your MyTaskMate account",
        text: `Your MyTaskMate verification code is ${code}. It expires in 10 minutes.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px"><h2>Verify your MyTaskMate account</h2><p>Enter this code to finish creating your account:</p><p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#6d28d9">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`,
    });
};

export const sendPasswordResetOtp = async (email: string, code: string) => {
    const transporter = getTransporter();
    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: "Reset your MyTaskMate password",
        text: `Your MyTaskMate password reset code is ${code}. It expires in 10 minutes.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px"><h2>Reset your MyTaskMate password</h2><p>Enter this code to choose a new password:</p><p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#6d28d9">${code}</p><p>This code expires in 10 minutes. If you did not request a password reset, you can ignore this email.</p></div>`,
    });
};
