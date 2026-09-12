import { Router } from "express";
import { TdsTcsController } from "./tds-tcs.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", TdsTcsController.list);
router.post("/", TdsTcsController.create);

export default router;
