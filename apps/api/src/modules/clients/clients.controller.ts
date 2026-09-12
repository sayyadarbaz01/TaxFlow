import { Request, Response, NextFunction } from "express";
import { ClientsService } from "./clients.service";
import { ClientSchema } from "@ca-saas/shared-types";

export class ClientsController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ClientsService.listClients(req.user!, req.query);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await ClientsService.getClientById(req.params.id, req.user!);
      return res.json(client);
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ClientSchema.parse(req.body);
      const dto = {
        ...parsed,
        status: req.body.status || (parsed as any).status || "ACTIVE"
      };
      const client = await ClientsService.createClient(dto as any, req.user!);
      return res.status(201).json(client);
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await ClientsService.updateClient(req.params.id, req.body, req.user!);
      return res.json(client);
    } catch (err) {
      next(err);
    }
  }

  public static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ClientsService.deleteClient(req.params.id, req.user!);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
