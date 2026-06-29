import mongoose, { Schema, Types } from "mongoose";

export type TaskPriority = "High" | "Medium" | "Low";
export type TaskStatus = "Pending" | "In Progress" | "Completed";

export interface ITask {
    user: Types.ObjectId;
    title: string;
    project: string;
    dueDate: Date;
    time?: string;
    priority: TaskPriority;
    status: TaskStatus;
    nextAction?: string;
    completedAt?: Date;
}

const taskSchema = new Schema<ITask>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        title: { type: String, required: true, trim: true, maxlength: 160 },
        project: { type: String, trim: true, default: "General", maxlength: 80 },
        dueDate: { type: Date, required: true, index: true },
        time: { type: String, trim: true },
        priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
        status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
        nextAction: { type: String, trim: true, maxlength: 500 },
        completedAt: Date,
    },
    { timestamps: true }
);

taskSchema.index({ user: 1, dueDate: 1, status: 1 });

export default mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema);
