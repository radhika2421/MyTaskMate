import type { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { buildProductivityContext } from "../services/productivityService.ts";

const fallbackInsights = [
    "Your strongest work window is late morning; reserve it for high-priority tasks.",
    "Overdue work is clustering around vague next actions. Define the first 10-minute step when creating a task.",
    "A short evening review can protect your current habit streak and reduce next-day planning time.",
];
const fallbackQuote = { text: "Your mind is for having ideas, not holding them.", author: "David Allen" };
const getClient = () => process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const fallbackPlan = (message: string) =>
    `Here is a practical reset for "${message}":\n\n1. Protect the nearest deadline first.\n2. Choose one 25-minute focus block for the highest-impact task.\n3. Move flexible work after fixed calendar events.\n4. Review the plan after the focus block and adjust only what changed.`;
const parseJson = (value: string) => JSON.parse(value.replace(/^```json\s*/i, "").replace(/```$/i, "").trim());

export const generatePlan = async (req: Request, res: Response) => {
    const message = String(req.body?.message || "Help me plan my day").trim();
    const client = getClient();
    if (!client) return res.json({ reply: fallbackPlan(message), source: "fallback" });

    try {
        const context = await buildProductivityContext(req);
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are MyTaskMate, a concise productivity coach. Re-plan work using only the verified tasks, goals, habits, focus history, profile, and fixed Google Calendar events below. Give an actionable schedule with times and briefly explain priority changes. Never invent events, deadlines, completion history, or metrics. Never shame the user.\n\nUser request: ${message}\n\nVerified context: ${JSON.stringify(context)}`,
        });
        return res.json({ reply: response.text || fallbackPlan(message), source: "gemini" });
    } catch (error) {
        console.error("Gemini planner failed:", error instanceof Error ? error.message : error);
        return res.json({ reply: fallbackPlan(message), source: "fallback" });
    }
};

export const generateInsights = async (req: Request, res: Response) => {
    try {
        const context = await buildProductivityContext(req);
        const client = getClient();
        if (!client) return res.json({ insights: fallbackInsights, quote: fallbackQuote, metrics: context.metrics, timeline: context.timeline, source: "fallback" });

        try {
            const response = await client.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `You are MyTaskMate's productivity analyst. Use only the verified context below. Return JSON exactly shaped as {"insights":["three concise, supportive, actionable insights"],"quote":{"text":"one short original motivational sentence tailored to current priorities","author":"MyTaskMate AI"}}. Cover focus timing, procrastination or deadline risk, and one measurable improvement. Mention patterns only when supported. Never invent metrics, events, goals, or behavior.\n\nVerified context: ${JSON.stringify(context)}`,
                config: { responseMimeType: "application/json" },
            });
            const parsed = parseJson(response.text || "{}");
            const insights = Array.isArray(parsed.insights) ? parsed.insights.filter((item: unknown) => typeof item === "string").slice(0, 3) : [];
            const quote = typeof parsed.quote?.text === "string" ? { text: parsed.quote.text, author: "MyTaskMate AI" } : fallbackQuote;
            return res.json({ insights: insights.length === 3 ? insights : fallbackInsights, quote, metrics: context.metrics, timeline: context.timeline, source: "gemini" });
        } catch (error) {
            console.error("Gemini insights failed:", error instanceof Error ? error.message : error);
            return res.json({ insights: fallbackInsights, quote: fallbackQuote, metrics: context.metrics, timeline: context.timeline, source: "fallback" });
        }
    } catch (error) {
        console.error("Productivity report failed:", error instanceof Error ? error.message : error);
        return res.status(500).json({ message: "Unable to calculate productivity metrics." });
    }
};
