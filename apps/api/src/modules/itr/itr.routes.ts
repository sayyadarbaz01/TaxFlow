import { Router } from "express";
import { ItrController } from "./itr.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", ItrController.list);
router.get("/:id", ItrController.getById);
router.post("/", ItrController.create);
router.patch("/:id/status", ItrController.updateStatus);

export default router;
