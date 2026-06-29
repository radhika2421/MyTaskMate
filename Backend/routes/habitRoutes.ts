import { Router } from "express";
import { createHabit, deleteHabit, listHabits, updateHabit } from "../controllers/habitController.ts";
import { requireAuth } from "../middleware/requireAuth.ts";

const router = Router();
router.use(requireAuth);
router.get("/", listHabits);
router.post("/", createHabit);
router.patch("/:id", updateHabit);
router.delete("/:id", deleteHabit);
export default router;
