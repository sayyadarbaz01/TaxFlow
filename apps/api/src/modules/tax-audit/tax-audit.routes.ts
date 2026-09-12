import { Router } from "express";
import { TaxAuditController } from "./tax-audit.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/summary", TaxAuditController.getSummary);
router.get("/", TaxAuditController.list);
router.post("/", TaxAuditController.create);
router.patch("/:id/stage", TaxAuditController.updateStage);
router.get("/:id/clauses", TaxAuditController.getClauses);
router.patch("/:id/clauses/:clauseNumber", TaxAuditController.updateClause);

export default router;
