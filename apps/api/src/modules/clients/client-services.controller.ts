import { Request, Response, NextFunction } from "express";
import { ClientServicesService } from "./client-services.service";
import { ClientServiceSchema } from "@ca-saas/shared-types";

export class ClientServicesController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const services = await ClientServicesService.listServices(req.params.id, req.user!);
      return res.json(services);
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await ClientServicesService.getServiceById(req.params.id, req.params.serviceId, req.user!);
      return res.json(service);
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ClientServiceSchema.parse(req.body);
      const service = await ClientServicesService.createService(req.params.id, parsed, req.user!);
      return res.status(201).json(service);
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await ClientServicesService.updateService(
        req.params.id,
        req.params.serviceId,
        req.body,
        req.user!
      );
      return res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  public static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ClientServicesService.deleteService(req.params.id, req.params.serviceId, req.user!);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
