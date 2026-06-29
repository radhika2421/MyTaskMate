import mongoose, { Model, Schema } from "mongoose";

export interface IUser {
    googleId?: string;
    email: string;
    displayName: string;
    avatar?: string;
    passwordHash?: string;
    emailVerified: boolean;
    authVersion: number;
}

const userSchema = new Schema<IUser>(
    {
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true,
        },
        displayName: {
            type: String,
            required: true,
            trim: true,
        },
        avatar: String,
        passwordHash: { type: String, select: false },
        emailVerified: { type: Boolean, default: false },
        authVersion: { type: Number, default: 0, select: false },
    },
    { timestamps: true }
);

const User =
    (mongoose.models.User as Model<IUser> | undefined) ||
    mongoose.model<IUser>("User", userSchema);

export default User;
