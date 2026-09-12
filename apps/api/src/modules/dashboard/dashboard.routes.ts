import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../../middleware/auth";
import { DashboardService } from "./dashboard.service";

const router = Router();

router.get("/summary", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await DashboardService.getSummary(req.user!);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

export default router;
