import fs from "fs";
import path from "path";
import { config } from "../config";
import { logger } from "../lib/logger";

export interface IFileStorageAdapter {
  saveFile(fileName: string, buffer: Buffer): Promise<string>;
  deleteFile(fileUrl: string): Promise<boolean>;
}

export class LocalDiskStorageAdapter implements IFileStorageAdapter {
  private uploadDir: string;

  constructor() {
    this.uploadDir = config.storage.uploadDir;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  public async saveFile(fileName: string, buffer: Buffer): Promise<string> {
    const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(this.uploadDir, safeName);
    await fs.promises.writeFile(filePath, buffer);
    logger.info(`[LOCAL STORAGE] Saved document to ${filePath}`);
    return `/storage/${safeName}`;
  }

  public async deleteFile(fileUrl: string): Promise<boolean> {
    const fileName = path.basename(fileUrl);
    const filePath = path.join(this.uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }
}
