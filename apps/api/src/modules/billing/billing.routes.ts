import { Router } from "express";
import { BillingController } from "./billing.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", BillingController.list);
router.get("/:id", BillingController.getById);
router.get("/:id/upi-link", BillingController.getUpiLink);
router.post("/", BillingController.create);
router.post("/:id/mark-paid", BillingController.markPaid);

export default router;
