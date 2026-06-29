import type { Request } from "express";
import { google } from "googleapis";
import FocusSession from "../schema/FocusSession.ts";
import Goal from "../schema/Goal.ts";
import Habit from "../schema/Habit.ts";
import Task from "../schema/Task.ts";
import { getOAuthClient } from "../controllers/calenderController.ts";

const userId = (req: Request) => String(req.user?._id || req.user?.id);
const sameLocalDay = (left: Date, right: Date) => left.toLocaleDateString("en-CA") === right.toLocaleDateString("en-CA");
const timeLabel = (date: Date) => new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(date);

const taskDeadline = (task: any) => {
    const deadline = new Date(task.dueDate);
    if (task.time && /^\d{2}:\d{2}$/.test(task.time)) {
        const [hours, minutes] = task.time.split(":").map(Number);
        deadline.setHours(hours, minutes, 59, 999);
    } else {
        deadline.setHours(23, 59, 59, 999);
    }
    return deadline;
};

const focusWindow = (sessions: any[]) => {
    if (!sessions.length) return "Not enough data";
    const hours = new Map<number, { seconds: number; count: number }>();
    for (const session of sessions) {
        const hour = new Date(session.completedAt).getHours();
        const current = hours.get(hour) || { seconds: 0, count: 0 };
        current.seconds += session.focusedSeconds;
        current.count += 1;
        hours.set(hour, current);
    }
    const best = [...hours.entries()].sort((a, b) => (b[1].seconds / b[1].count) - (a[1].seconds / a[1].count))[0]?.[0];
    if (best === undefined) return "Not enough data";
    const formatHour = (hour: number) => new Intl.DateTimeFormat("en-IN", { hour: "numeric" }).format(new Date(2026, 0, 1, hour));
    return `${formatHour(best)} - ${formatHour((best + 1) % 24)}`;
};

const streakDays = (habits: any[], today: Date) => {
    if (!habits.length) return 0;
    const currentDayIndex = (today.getDay() + 6) % 7;
    const completedByDay = Array.from({ length: 7 }, (_, index) => habits.some((habit) => Boolean(habit.days?.[index])));
    let cursor = currentDayIndex;
    if (!completedByDay[cursor]) cursor -= 1;
    let streak = 0;
    while (cursor >= 0 && completedByDay[cursor]) {
        streak += 1;
        cursor -= 1;
    }
    return streak;
};

const loadCalendarEvents = async (req: Request, start: Date, end: Date) => {
    const auth = getOAuthClient(req);
    if (!auth) return [];
    try {
        const calendar = google.calendar({ version: "v3", auth });
        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: "startTime",
        });
        return (response.data.items || []).map((event) => ({
            id: event.id,
            title: event.summary || "Untitled event",
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            location: event.location || "",
        }));
    } catch (error) {
        console.error("Calendar context unavailable:", error instanceof Error ? error.message : error);
        return [];
    }
};

export const buildProductivityContext = async (req: Request) => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [tasks, goals, habits, focusSessions, calendarEvents] = await Promise.all([
        Task.find({ user: userId(req) }).sort({ dueDate: 1 }).lean(),
        Goal.find({ user: userId(req) }).sort({ updatedAt: -1 }).lean(),
        Habit.find({ user: userId(req) }).lean(),
        FocusSession.find({ user: userId(req), completedAt: { $gte: thirtyDaysAgo } }).sort({ completedAt: -1 }).lean(),
        loadCalendarEvents(req, todayStart, todayEnd),
    ]);

    const dueToday = tasks.filter((task: any) => sameLocalDay(new Date(task.dueDate), now));
    const overdue = tasks.filter((task: any) => task.status !== "Completed" && taskDeadline(task) < now);
    const completedWithTiming = tasks.filter((task: any) => task.status === "Completed" && task.completedAt);
    const completedOnTime = completedWithTiming.filter((task: any) => new Date(task.completedAt) <= taskDeadline(task));
    const averageFocusMinutes = focusSessions.length
        ? Math.round(focusSessions.reduce((sum: number, session: any) => sum + session.focusedSeconds, 0) / focusSessions.length / 60)
        : 0;
    const habitScore = habits.length ? Math.round(habits.reduce((sum: number, habit: any) => sum + habit.score, 0) / habits.length) : 0;

    const timeline = [
        ...dueToday.filter((task: any) => task.status !== "Completed").map((task: any) => ({
            id: `task-${task._id}`,
            title: task.title,
            time: task.time || "Any time",
            type: "Task",
            sortTime: taskDeadline(task).getTime(),
        })),
        ...calendarEvents.map((event: any) => ({
            id: `event-${event.id}`,
            title: event.title,
            time: event.start ? timeLabel(new Date(event.start)) : "All day",
            type: "Calendar",
            sortTime: event.start ? new Date(event.start).getTime() : todayStart.getTime(),
        })),
    ].sort((a, b) => a.sortTime - b.sortTime).slice(0, 8).map(({ sortTime: _sortTime, ...item }) => item);

    const metrics = {
        bestFocusWindow: focusWindow(focusSessions),
        averageFocusMinutes,
        totalFocusSessions: focusSessions.length,
        onTimeCompletionRate: completedWithTiming.length ? Math.round((completedOnTime.length / completedWithTiming.length) * 100) : null,
        deadlinesMissed: overdue.length,
        currentStreakDays: streakDays(habits, now),
        habitScore,
        pendingToday: dueToday.filter((task: any) => task.status !== "Completed").length,
        dueToday: dueToday.length,
        completedToday: dueToday.filter((task: any) => task.status === "Completed").length,
        highPriorityOpen: tasks.filter((task: any) => task.priority === "High" && task.status !== "Completed").length,
        eventsToday: calendarEvents.length,
    };

    return {
        profile: { displayName: req.user?.displayName, emailVerified: req.user?.emailVerified },
        metrics,
        timeline,
        tasks: tasks.slice(0, 40).map((task: any) => ({ title: task.title, dueDate: task.dueDate, time: task.time, priority: task.priority, status: task.status, nextAction: task.nextAction })),
        goals: goals.slice(0, 20).map((goal: any) => ({ title: goal.title, period: goal.period, tag: goal.tag, progress: goal.progress, status: goal.status, latestNote: goal.notes?.at(-1)?.text })),
        habits: habits.map((habit: any) => ({ name: habit.name, cadence: habit.cadence, score: habit.score, status: habit.status, days: habit.days })),
        focusSessions: focusSessions.slice(0, 30).map((session: any) => ({ activity: session.activity, focusedMinutes: Math.round(session.focusedSeconds / 60), completed: session.completed, completedAt: session.completedAt })),
        calendarEvents,
    };
};
