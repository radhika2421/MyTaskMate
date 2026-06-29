import { Router } from "express";
import {
    createCalendarEvent,
    getCalendarStatus,
    getUpcomingEvents,
} from "../controllers/calenderController.ts";

const router = Router();

router.get("/status", getCalendarStatus);
router.get("/events", getUpcomingEvents);
router.post("/events", createCalendarEvent);

export default router;
