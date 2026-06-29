import { Router } from "express";
import { generateInsights, generatePlan } from "../controllers/aiprodController.ts";
import { requireAuth } from "../middleware/requireAuth.ts";

const router = Router();
router.use(requireAuth);

router.post("/plan", generatePlan);
router.post("/insights", generateInsights);

export default router;
