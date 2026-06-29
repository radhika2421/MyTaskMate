import type { Request, Response } from "express";
import Task from "../schema/Task.ts";

const userId = (req: Request) => String(req.user?._id || req.user?.id);

export const listTasks = async (req: Request, res: Response) => {
    try {
        const tasks = await Task.find({ user: userId(req) }).sort({ dueDate: 1, createdAt: -1 }).lean();
        return res.json({ tasks });
    } catch (error) {
        console.error("Unable to list tasks:", error);
        return res.status(500).json({ message: "Unable to load tasks." });
    }
};

export const createTask = async (req: Request, res: Response) => {
    try {
        const { title, project, dueDate, time, priority, status, nextAction } = req.body;
        if (!title?.trim() || !dueDate) {
            return res.status(400).json({ message: "Task title and due date are required." });
        }

        const task = await Task.create({
            user: userId(req),
            title: title.trim(),
            project: project?.trim() || "General",
            dueDate,
            time,
            priority: priority || "Medium",
            status: status || "Pending",
            nextAction: nextAction?.trim(),
            completedAt: status === "Completed" ? new Date() : undefined,
        });
        return res.status(201).json({ task });
    } catch (error) {
        console.error("Unable to create task:", error);
        return res.status(400).json({ message: "Unable to create task. Check the supplied values." });
    }
};

export const updateTask = async (req: Request, res: Response) => {
    const allowed = ["title", "project", "dueDate", "time", "priority", "status", "nextAction"] as const;
    const updates = Object.fromEntries(
        allowed.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
    );
    if (req.body.status === "Completed") updates.completedAt = new Date();
    if (req.body.status && req.body.status !== "Completed") updates.completedAt = null;

    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: userId(req) },
            updates,
            { returnDocument: 'after', runValidators: true }
        );
        if (!task) return res.status(404).json({ message: "Task not found." });
        return res.json({ task });
    } catch (error) {
        console.error("Unable to update task:", error);
        return res.status(400).json({ message: "Unable to update task." });
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: userId(req) });
    if (!task) return res.status(404).json({ message: "Task not found." });
    return res.json({ message: "Task deleted." });
};
