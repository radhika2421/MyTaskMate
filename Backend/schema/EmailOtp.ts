import mongoose, { Schema, Types } from "mongoose";

export interface IEmailOtp {
    user: Types.ObjectId;
    email: string;
    purpose: "email-verification" | "password-reset";
    codeHash: string;
    expiresAt: Date;
    attempts: number;
}

const emailOtpSchema = new Schema<IEmailOtp>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        email: { type: String, required: true, lowercase: true, trim: true, index: true },
        purpose: {
            type: String,
            enum: ["email-verification", "password-reset"],
            default: "email-verification",
            required: true,
            index: true,
        },
        codeHash: { type: String, required: true },
        expiresAt: { type: Date, required: true, index: { expires: 0 } },
        attempts: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export default mongoose.models.EmailOtp || mongoose.model<IEmailOtp>("EmailOtp", emailOtpSchema);
