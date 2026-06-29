import mongoose, { Schema, Types } from "mongoose";

export type HabitStatus = "Pending" | "In Progress" | "Completed";

export interface IHabit {
    user: Types.ObjectId;
    name: string;
    cadence: "Daily" | "Long term";
    days: boolean[];
    score: number;
    status: HabitStatus;
}

const habitSchema = new Schema<IHabit>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        name: { type: String, required: true, trim: true, maxlength: 120 },
        cadence: { type: String, enum: ["Daily", "Long term"], default: "Daily" },
        days: {
            type: [Boolean],
            default: () => Array(7).fill(false),
            validate: {
                validator: (days: boolean[]) => days.length === 7,
                message: "Habit check-ins must contain seven days.",
            },
        },
        score: { type: Number, min: 0, max: 100, default: 0 },
        status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
    },
    { timestamps: true }
);

habitSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Habit || mongoose.model<IHabit>("Habit", habitSchema);
