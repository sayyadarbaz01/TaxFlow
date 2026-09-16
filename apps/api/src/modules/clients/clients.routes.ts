import { Router } from "express";
import { ClientsController } from "./clients.controller";
import { ClientServicesController } from "./client-services.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", ClientsController.list);
router.get("/:id", ClientsController.getById);
router.post("/", ClientsController.create);
router.put("/:id", ClientsController.update);
router.patch("/:id", ClientsController.update);
router.delete("/:id", ClientsController.remove);

// Multiple Services / Work Items per Client
router.get("/:id/services", ClientServicesController.list);
router.post("/:id/services", ClientServicesController.create);
router.get("/:id/services/:serviceId", ClientServicesController.getById);
router.put("/:id/services/:serviceId", ClientServicesController.update);
router.patch("/:id/services/:serviceId", ClientServicesController.update);
router.delete("/:id/services/:serviceId", ClientServicesController.remove);

export default router;

