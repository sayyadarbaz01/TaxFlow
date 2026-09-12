import { Router } from "express";
import { GstRegistrationController } from "./gst-registration.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/summary", GstRegistrationController.getSummary);
router.get("/", GstRegistrationController.list);
router.post("/", GstRegistrationController.create);
router.patch("/:id/stage", GstRegistrationController.advanceStage);
router.post("/:id/sync-client", GstRegistrationController.syncToClient);

export default router;
