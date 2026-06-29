import { Router } from "express";
import { addGoalNote, createGoal, deleteGoal, listGoals, updateGoal } from "../controllers/goalController.ts";
import { requireAuth } from "../middleware/requireAuth.ts";

const router = Router();
router.use(requireAuth);
router.get("/", listGoals);
router.post("/", createGoal);
router.patch("/:id", updateGoal);
router.post("/:id/notes", addGoalNote);
router.delete("/:id", deleteGoal);
export default router;
