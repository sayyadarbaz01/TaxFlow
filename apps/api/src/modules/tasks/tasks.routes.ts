import { Router } from "express";
import { TasksController } from "./tasks.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", TasksController.list);
router.post("/", TasksController.create);
router.patch("/:id/status", TasksController.updateStatus);

export default router;
1