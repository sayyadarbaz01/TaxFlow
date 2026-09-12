import { Request, Response, NextFunction } from "express";
import { DocumentsService } from "./documents.service";
import { DocType, DocSource } from "@ca-saas/shared-types";
import { ValidationError } from "../../middleware/errorHandler";

export class DocumentsController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DocumentsService.listDocuments(req.user!, req.query);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getGrouped(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DocumentsService.getGroupedByClient(req.user!, req.query);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DocumentsService.getClientChecklist(req.params.clientId, req.user!);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new ValidationError("No document file uploaded");
      const clientId = req.body.clientId;
      const docType = req.body.docType as DocType;
      const documentName = req.body.documentName as string;
      const source = (req.body.source || "MANUAL") as DocSource;

      if (!clientId || !docType) {
        throw new ValidationError("clientId and docType are required fields");
      }

      const doc = await DocumentsService.uploadDocument(
        clientId,
        docType,
        req.file.originalname,
        req.file.buffer,
        source,
        documentName,
        req.user!
      );

      return res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  }

  public static async downloadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { filePath, fileName } = await DocumentsService.getDocumentFile(req.params.id, req.user!);
      return res.download(filePath, fileName);
    } catch (err) {
      next(err);
    }
  }

  public static async viewFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { filePath, fileName } = await DocumentsService.getDocumentFile(req.params.id, req.user!);
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileName)}"`);
      return res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }

  public static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DocumentsService.deleteDocument(req.params.id, req.user!);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
