import { Router } from "express";
import { GstController } from "./gst.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/upcoming-due", GstController.getUpcomingDue);
router.get("/", GstController.list);
router.post("/", GstController.create);
router.patch("/:id/mark-filed", GstController.markFiled);

export default router;
