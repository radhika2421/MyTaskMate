import { Router } from "express";
import { createTask, deleteTask, listTasks, updateTask } from "../controllers/taskController.ts";
import { requireAuth } from "../middleware/requireAuth.ts";

const router = Router();
router.use(requireAuth);
router.get("/", listTasks);
router.post("/", createTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);
export default router;
