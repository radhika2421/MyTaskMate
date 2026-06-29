import { createHash, randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import EmailOtp from "../schema/EmailOtp.ts";
import User, { type IUser } from "../schema/User.ts";
import { sendPasswordResetOtp, sendVerificationOtp } from "../services/emailService.ts";

const scrypt = promisify(scryptCallback);
type OtpPurpose = "email-verification" | "password-reset";
const normalizeEmail = (email: unknown) => String(email || "").trim().toLowerCase();
const jwtSecret = () => process.env.JWT_SECRET || process.env.SESSION_SECRET || "development-jwt-secret";
const otpHash = (email: string, code: string, purpose: OtpPurpose) =>
    createHash("sha256").update(`${email}:${purpose}:${code}:${jwtSecret()}`).digest("hex");

const hashPassword = async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const hash = await scrypt(password, salt, 64) as Buffer;
    return `${salt}:${hash.toString("hex")}`;
};

const verifyPassword = async (password: string, stored: string) => {
    const [salt, storedHex] = stored.split(":");
    if (!salt || !storedHex) return false;
    const derived = await scrypt(password, salt, 64) as Buffer;
    const expected = Buffer.from(storedHex, "hex");
    return expected.length === derived.length && timingSafeEqual(expected, derived);
};

const publicUser = (user: IUser & { _id?: unknown; id?: string }) => ({
    _id: String(user._id || user.id),
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
});

const issueJwt = (res: Response, user: IUser & { _id?: unknown; id?: string }) => {
    const token = jwt.sign(
        { sub: String(user._id || user.id), av: Number(user.authVersion || 0) },
        jwtSecret(),
        { expiresIn: "7d" },
    );
    res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

const createAndSendOtp = async (user: IUser & { _id: unknown }, email: string, purpose: OtpPurpose) => {
    const code = String(randomInt(100000, 1000000));
    await EmailOtp.deleteMany({ email, purpose });
    await EmailOtp.create({
        user: user._id,
        email,
        purpose,
        codeHash: otpHash(email, code, purpose),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    try {
        if (purpose === "password-reset") {
            await sendPasswordResetOtp(email, code);
        } else {
            await sendVerificationOtp(email, code);
        }
    } catch (error) {
        await EmailOtp.deleteMany({ email, purpose });
        throw error;
    }
};

export const signupWithEmail = async (req: Request, res: Response) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const displayName = String(req.body.displayName || "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
    if (password.length < 8) return res.status(400).json({ message: "Password must contain at least 8 characters." });
    if (!displayName) return res.status(400).json({ message: "Name is required." });

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                message: "An account already exists for this email. Please log in.",
                code: "ACCOUNT_EXISTS",
            });
        }

        const passwordHash = await hashPassword(password);
        const user = await User.create({ email, displayName, passwordHash, emailVerified: false });

        await createAndSendOtp(user, email, "email-verification");
        return res.status(201).json({ message: "Verification code sent.", email });
    } catch (error) {
        console.error("Email signup failed:", error instanceof Error ? error.message : error);
        return res.status(500).json({ message: error instanceof Error ? error.message : "Unable to create account." });
    }
};

export const verifyEmailOtp = async (req: Request, res: Response) => {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.otp || "").trim();
    try {
        const purpose: OtpPurpose = "email-verification";
        const record = await EmailOtp.findOne({ email, purpose }).sort({ createdAt: -1 });
        if (!record || record.expiresAt <= new Date()) return res.status(400).json({ message: "The verification code has expired. Request a new one." });
        if (record.attempts >= 5) return res.status(429).json({ message: "Too many incorrect attempts. Request a new code." });

        const actual = Buffer.from(otpHash(email, code, purpose));
        const expected = Buffer.from(record.codeHash);
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
            record.attempts += 1;
            await record.save();
            return res.status(400).json({ message: "Incorrect verification code." });
        }

        const user = await User.findByIdAndUpdate(record.user, { emailVerified: true }, { returnDocument: "after" })
            .select("+authVersion");
        if (!user) return res.status(404).json({ message: "Account not found." });
        await EmailOtp.deleteMany({ email, purpose });
        res.clearCookie("auth_token");
        return res.json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
        console.error("OTP verification failed:", error instanceof Error ? error.message : error);
        return res.status(500).json({ message: "Unable to verify email." });
    }
};

export const loginWithEmail = async (req: Request, res: Response) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    try {
        const user = await User.findOne({ email }).select("+passwordHash +authVersion");
        if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
            return res.status(401).json({ message: "Incorrect email or password." });
        }
        if (!user.emailVerified) return res.status(403).json({ message: "Verify your email before logging in.", code: "EMAIL_NOT_VERIFIED" });

        issueJwt(res, user);
        return res.json({ user: publicUser(user) });
    } catch (error) {
        console.error("Email login failed:", error instanceof Error ? error.message : error);
        return res.status(500).json({ message: "Unable to log in." });
    }
};

export const resendEmailOtp = async (req: Request, res: Response) => {
    const email = normalizeEmail(req.body.email);
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Account not found." });
        if (user.emailVerified) return res.status(400).json({ message: "This email is already verified." });
        await createAndSendOtp(user, email, "email-verification");
        return res.json({ message: "A new verification code was sent." });
    } catch (error) {
        console.error("OTP resend failed:", error instanceof Error ? error.message : error);
        return res.status(500).json({ message: error instanceof Error ? error.message : "Unable to resend code." });
    }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
    const email = normalizeEmail(req.body.email);
    const responseMessage = "If an email-password account exists, a reset code has been sent.";

    if (!/^\S+@\S+\.\S+$/.test(email)) return res.json({ message: responseMessage });

    try {
        const user = await User.findOne({ email }).select("+passwordHash");
        if (user?.passwordHash && user.emailVerified) {
            await createAndSendOtp(user, email, "password-reset");
        }
    } catch (error) {
        console.error("Password reset request failed:", error instanceof Error ? error.message : error);
    }
    return res.json({ message: responseMessage });
};

export const resetPassword = async (req: Request, res: Response) => {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.otp || "").trim();
    const password = String(req.body.password || "");
    const purpose: OtpPurpose = "password-reset";

    if (password.length < 8) {
        return res.status(400).json({ message: "Password must contain at least 8 characters." });
    }

    try {
        const record = await EmailOtp.findOne({ email, purpose }).sort({ createdAt: -1 });
        if (!record || record.expiresAt <= new Date()) {
            return res.status(400).json({ message: "The reset code is invalid or expired. Request a new one." });
        }
        if (record.attempts >= 5) {
            return res.status(429).json({ message: "Too many incorrect attempts. Request a new code." });
        }

        const actual = Buffer.from(otpHash(email, code, purpose));
        const expected = Buffer.from(record.codeHash);
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
            record.attempts += 1;
            await record.save();
            return res.status(400).json({ message: "Incorrect reset code." });
        }

        const passwordHash = await hashPassword(password);
        const user = await User.findByIdAndUpdate(
            record.user,
            { $set: { passwordHash }, $inc: { authVersion: 1 } },
            { returnDocument: "after" },
        );
        if (!user) return res.status(404).json({ message: "Account not found." });

        await EmailOtp.deleteMany({ email, purpose });
        res.clearCookie("auth_token");
        return res.json({ message: "Password reset successfully. Log in with your new password." });
    } catch (error) {
        console.error("Password reset failed:", error instanceof Error ? error.message : error);
        return res.status(500).json({ message: "Unable to reset password." });
    }
};
