import { Router } from "express";
import { createFocusSession, getFocusSummary } from "../controllers/focusSessionController.ts";
import { requireAuth } from "../middleware/requireAuth.ts";

const router = Router();
router.use(requireAuth);
router.post("/", createFocusSession);
router.get("/summary", getFocusSummary);
export default router;
