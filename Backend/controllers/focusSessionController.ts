import type { Request, Response } from "express";
import { Types } from "mongoose";
import FocusSession from "../schema/FocusSession.ts";

const userId = (req: Request) => String(req.user?._id || req.user?.id);

export const createFocusSession = async (req: Request, res: Response) => {
    try {
        const activity = String(req.body.activity || "Focus session").trim();
        const plannedMinutes = Number(req.body.plannedMinutes);
        const focusedSeconds = Number(req.body.focusedSeconds);
        if (!activity || !Number.isFinite(plannedMinutes) || !Number.isFinite(focusedSeconds) || focusedSeconds < 1) {
            return res.status(400).json({ message: "Valid focus-session details are required." });
        }

        const session = await FocusSession.create({
            user: userId(req),
            activity,
            plannedMinutes,
            focusedSeconds,
            completed: Boolean(req.body.completed),
        });
        return res.status(201).json({ session });
    } catch (error) {
        console.error("Unable to save focus session:", error);
        return res.status(400).json({ message: "Unable to save focus session." });
    }
};

export const getFocusSummary = async (req: Request, res: Response) => {
    try {
        const [summary] = await FocusSession.aggregate([
            { $match: { user: new Types.ObjectId(userId(req)) } },
            { $group: { _id: null, averageSeconds: { $avg: "$focusedSeconds" }, totalSessions: { $sum: 1 } } },
        ]);
        return res.json({
            averageFocusMinutes: summary ? Math.round(summary.averageSeconds / 60) : 0,
            totalSessions: summary?.totalSessions || 0,
        });
    } catch (error) {
        console.error("Unable to load focus summary:", error);
        return res.status(500).json({ message: "Unable to load focus summary." });
    }
};
