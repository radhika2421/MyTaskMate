import mongoose, { Schema, Types } from "mongoose";

export interface IFocusSession {
    user: Types.ObjectId;
    activity: string;
    plannedMinutes: number;
    focusedSeconds: number;
    completed: boolean;
    completedAt: Date;
}

const focusSessionSchema = new Schema<IFocusSession>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        activity: { type: String, required: true, trim: true, maxlength: 120 },
        plannedMinutes: { type: Number, required: true, min: 1, max: 240 },
        focusedSeconds: { type: Number, required: true, min: 1, max: 14400 },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date, default: Date.now, index: true },
    },
    { timestamps: true }
);

focusSessionSchema.index({ user: 1, completedAt: -1 });

export default mongoose.models.FocusSession || mongoose.model<IFocusSession>("FocusSession", focusSessionSchema);
