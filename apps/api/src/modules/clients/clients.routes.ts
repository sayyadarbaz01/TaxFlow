import { Router } from "express";
import { ClientsController } from "./clients.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", ClientsController.list);
router.get("/:id", ClientsController.getById);
router.post("/", ClientsController.create);
router.put("/:id", ClientsController.update);
router.patch("/:id", ClientsController.update);
router.delete("/:id", ClientsController.remove);

export default router;
