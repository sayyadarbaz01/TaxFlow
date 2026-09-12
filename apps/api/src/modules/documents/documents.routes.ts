import { Router } from "express";
import multer from "multer";
import { DocumentsController } from "./documents.controller";
import { requireAuth } from "../../middleware/auth";

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB max
const router = Router();

router.use(requireAuth);

router.get("/grouped", DocumentsController.getGrouped);
router.get("/checklist/:clientId", DocumentsController.getChecklist);
router.get("/:id/view", DocumentsController.viewFile);
router.get("/:id/download", DocumentsController.downloadFile);
router.get("/", DocumentsController.list);
router.post("/upload", upload.single("file"), DocumentsController.upload);
router.delete("/:id", DocumentsController.remove);

export default router;
