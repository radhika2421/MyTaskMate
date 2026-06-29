import { Request, Response } from "express";
import session from "express-session";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

export const getOAuthClient = (req: Request) => {
    const tokens = (req.session as any).googleCalendarTokens;

    if (!tokens?.accessToken) {
        return null;
    }

    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL
    );

    client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
    });

    return client;
};

export const getCalendarStatus = (req: Request, res: Response) => {
    const isConnected = Boolean((req.session as any).googleCalendarTokens?.accessToken);
    res.json({ connected: isConnected });
};

export const getUpcomingEvents = async (req: Request, res: Response) => {
    try {
        const auth = getOAuthClient(req);

        if (!auth) {
            return res.status(401).json({
                message: "Google Calendar is not connected. Sign in with Google again to grant calendar access.",
            });
        }

        const calendar = google.calendar({ version: "v3", auth });
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const monthFromNow = new Date(now);
        monthFromNow.setDate(now.getDate() + 30);

        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: now.toISOString(),
            timeMax: monthFromNow.toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: "startTime",
        });

        const events = (response.data.items || []).map((event) => ({
            id: event.id,
            title: event.summary || "Untitled event",
            description: event.description || "",
            location: event.location || "",
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            htmlLink: event.htmlLink,
        }));

        return res.json({ events });
    } catch (error) {
        console.error("Google Calendar events fetch failed:", error);
        return res.status(500).json({ message: "Unable to fetch Google Calendar events." });
    }
};

export const createCalendarEvent = async (req: Request, res: Response) => {
    try {
        const auth = getOAuthClient(req);

        if (!auth) {
            return res.status(401).json({
                message: "Google Calendar is not connected. Sign in with Google again to grant calendar access.",
            });
        }

        const { title, description, location, start, end } = req.body;

        if (!title || !start || !end) {
            return res.status(400).json({ message: "title, start, and end are required." });
        }

        if (new Date(end) <= new Date(start)) {
            return res.status(400).json({ message: "Event end time must be after its start time." });
        }

        const calendar = google.calendar({ version: "v3", auth });
        const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: {
                summary: title,
                description,
                location,
                start: { dateTime: start },
                end: { dateTime: end },
            },
        });

        return res.status(201).json({ event: response.data });
    } catch (error) {
        console.error("Google Calendar event creation failed:", error);
        return res.status(500).json({ message: "Unable to create Google Calendar event." });
    }
};
