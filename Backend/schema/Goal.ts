import mongoose, { Schema, Types } from "mongoose";

export type GoalPeriod = "Day" | "Week" | "Month" | "Year";
export type GoalStatus = "Pending" | "In Progress" | "Completed";
export type GoalTag = "Work" | "Personal" | "Mind" | "Health" | "Relationships" | "Finance" | "Learning" | "Other";

export interface IGoalNote {
    _id?: Types.ObjectId;
    text: string;
    date: Date;
}

export interface IGoal {
    user: Types.ObjectId;
    title: string;
    period: GoalPeriod;
    tag: GoalTag;
    milestone?: string;
    progress: number;
    status: GoalStatus;
    notes: IGoalNote[];
}

const noteSchema = new Schema<IGoalNote>(
    {
        text: { type: String, required: true, trim: true, maxlength: 1000 },
        date: { type: Date, default: Date.now },
    },
    { _id: true }
);

const goalSchema = new Schema<IGoal>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        title: { type: String, required: true, trim: true, maxlength: 180 },
        period: { type: String, enum: ["Day", "Week", "Month", "Year"], default: "Week" },
        tag: { type: String, enum: ["Work", "Personal", "Mind", "Health", "Relationships", "Finance", "Learning", "Other"], default: "Personal" },
        milestone: { type: String, trim: true, maxlength: 500 },
        progress: { type: Number, min: 0, max: 100, default: 0 },
        status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
        notes: { type: [noteSchema], default: [] },
    },
    { timestamps: true }
);

goalSchema.index({ user: 1, period: 1, status: 1 });

export default mongoose.models.Goal || mongoose.model<IGoal>("Goal", goalSchema);
