import type { Request, Response } from "express";
import Habit from "../schema/Habit.ts";

const userId = (req: Request) => String(req.user?._id || req.user?.id);
const scoreFor = (days: boolean[]) => Math.round((days.filter(Boolean).length / 7) * 100);

export const listHabits = async (req: Request, res: Response) => {
    try {
        const habits = await Habit.find({ user: userId(req) }).sort({ createdAt: -1 }).lean();
        return res.json({ habits });
    } catch (error) {
        console.error("Unable to list habits:", error);
        return res.status(500).json({ message: "Unable to load habits." });
    }
};

export const createHabit = async (req: Request, res: Response) => {
    try {
        const { name, cadence } = req.body;
        if (!name?.trim()) return res.status(400).json({ message: "Habit name is required." });
        const habit = await Habit.create({ user: userId(req), name: name.trim(), cadence: cadence || "Daily" });
        return res.status(201).json({ habit });
    } catch (error) {
        console.error("Unable to create habit:", error);
        return res.status(400).json({ message: "Unable to create habit." });
    }
};

export const updateHabit = async (req: Request, res: Response) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.id, user: userId(req) });
        if (!habit) return res.status(404).json({ message: "Habit not found." });

        if (req.body.name !== undefined) habit.name = String(req.body.name).trim();
        if (req.body.cadence !== undefined) habit.cadence = req.body.cadence;
        if (req.body.status !== undefined) habit.status = req.body.status;
        if (req.body.days !== undefined) {
            if (!Array.isArray(req.body.days) || req.body.days.length !== 7) {
                return res.status(400).json({ message: "Habit check-ins must contain seven days." });
            }
            habit.days = req.body.days.map(Boolean);
            habit.score = scoreFor(habit.days);
            if (req.body.status === undefined) {
                habit.status = habit.days.every(Boolean) ? "Completed" : habit.days.some(Boolean) ? "In Progress" : "Pending";
            }
        }

        await habit.save();
        return res.json({ habit });
    } catch (error) {
        console.error("Unable to update habit:", error);
        return res.status(400).json({ message: "Unable to update habit." });
    }
};

export const deleteHabit = async (req: Request, res: Response) => {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: userId(req) });
    if (!habit) return res.status(404).json({ message: "Habit not found." });
    return res.json({ message: "Habit deleted." });
};
