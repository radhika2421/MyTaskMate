import type { Request, Response } from "express";
import Goal from "../schema/Goal.ts";

const userId = (req: Request) => String(req.user?._id || req.user?.id);

export const listGoals = async (req: Request, res: Response) => {
    try {
        const goals = await Goal.find({ user: userId(req) }).sort({ createdAt: -1 }).lean();
        return res.json({ goals });
    } catch (error) {
        console.error("Unable to list goals:", error);
        return res.status(500).json({ message: "Unable to load goals." });
    }
};

export const createGoal = async (req: Request, res: Response) => {
    try {
        const { title, period, tag, milestone } = req.body;
        if (!title?.trim()) return res.status(400).json({ message: "Goal title is required." });

        const goal = await Goal.create({
            user: userId(req),
            title: title.trim(),
            period: period || "Week",
            tag: tag || "Personal",
            milestone: milestone?.trim(),
        });
        return res.status(201).json({ goal });
    } catch (error) {
        console.error("Unable to create goal:", error);
        return res.status(400).json({ message: "Unable to create goal. Check the supplied values." });
    }
};

export const updateGoal = async (req: Request, res: Response) => {
    const allowed = ["title", "period", "tag", "milestone", "progress", "status"] as const;
    const updates = Object.fromEntries(
        allowed.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
    );

    if (updates.progress !== undefined && updates.status === undefined) {
        const progress = Number(updates.progress);
        updates.status = progress >= 100 ? "Completed" : progress > 0 ? "In Progress" : "Pending";
    }

    try {
        const goal = await Goal.findOneAndUpdate(
            { _id: req.params.id, user: userId(req) },
            updates,
            { returnDocument: 'after', runValidators: true }
        );
        if (!goal) return res.status(404).json({ message: "Goal not found." });
        return res.json({ goal });
    } catch (error) {
        console.error("Unable to update goal:", error);
        return res.status(400).json({ message: "Unable to update goal." });
    }
};

export const addGoalNote = async (req: Request, res: Response) => {
    try {
        const text = String(req.body.text || "").trim();
        if (!text) return res.status(400).json({ message: "Progress note cannot be empty." });

        const goal = await Goal.findOne({ _id: req.params.id, user: userId(req) });
        if (!goal) return res.status(404).json({ message: "Goal not found." });

        goal.notes.push({ text, date: req.body.date ? new Date(req.body.date) : new Date() });
        await goal.save();
        return res.status(201).json({ goal });
    } catch (error) {
        console.error("Unable to add goal note:", error);
        return res.status(400).json({ message: "Unable to add progress note." });
    }
};

export const deleteGoal = async (req: Request, res: Response) => {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: userId(req) });
    if (!goal) return res.status(404).json({ message: "Goal not found." });
    return res.json({ message: "Goal deleted." });
};
