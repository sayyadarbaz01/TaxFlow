import path from "path";
import fs from "fs";
import { prisma } from "../../lib/db";
import { config } from "../../config";
import { LocalDiskStorageAdapter } from "../../adapters/FileStorageAdapter";
import { scopeToAssignedClients, verifyClientAccess } from "../../lib/permissions";
import { buildPaginationParams, formatPaginatedResponse } from "../../lib/utils";
import { eventBus } from "../../lib/event-bus";
import { NotFoundError } from "../../middleware/errorHandler";
import { AuthUser, DocType, DocSource } from "@ca-saas/shared-types";

const storageAdapter = new LocalDiskStorageAdapter();

export class DocumentsService {
  public static async listDocuments(user: AuthUser, query: Record<string, any>) {
    const { page, pageSize, skip } = buildPaginationParams(query);
    const clientId = query.clientId as string;
    const docType = query.docType as string;
    const search = query.search as string;

    // Check row-level security: non-admins cannot request another client's documents
    if (clientId) {
      await verifyClientAccess(user, clientId);
    }

    const clientScope = scopeToAssignedClients(user, {});
    const whereCondition: any = {
      client: clientScope
    };

    if (clientId) {
      whereCondition.clientId = clientId;
    }

    if (docType && docType !== "ALL") {
      whereCondition.docType = docType;
    }

    if (search) {
      whereCondition.OR = [
        { fileName: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
        { client: { pan: { contains: search, mode: "insensitive" } } }
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.clientDocument.findMany({
        where: whereCondition,
        include: { client: { select: { id: true, name: true, pan: true, entityType: true } } },
        skip,
        take: pageSize,
        orderBy: { uploadedAt: "desc" }
      }),
      prisma.clientDocument.count({ where: whereCondition })
    ]);

    const formatted = documents.map(d => ({
      id: d.id,
      clientId: d.clientId,
      clientName: d.client.name,
      clientPan: d.client.pan,
      entityType: d.client.entityType,
      docType: d.docType,
      fileUrl: d.fileUrl,
      fileName: d.fileName,
      uploadedBy: d.uploadedBy,
      source: d.source,
      status: d.status,
      uploadedAt: d.uploadedAt.toISOString()
    }));

    return formatPaginatedResponse(formatted, total, page, pageSize);
  }

  /**
   * Grouped Documents view for Admin / CA overview
   */
  public static async getGroupedByClient(user: AuthUser, query: Record<string, any>) {
    const search = query.search as string;

    const clientScope = scopeToAssignedClients(user, {});
    const clientWhere: any = {
      ...clientScope,
      status: "ACTIVE"
    };

    if (search) {
      clientWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { pan: { contains: search, mode: "insensitive" } }
      ];
    }

    const clients = await prisma.client.findMany({
      where: clientWhere,
      include: {
        documents: {
          orderBy: { uploadedAt: "desc" }
        }
      },
      orderBy: { name: "asc" },
      take: 50
    });

    const requiredTypes: DocType[] = ["PAN", "BANK_STATEMENT", "AADHAAR", "EMAIL_ID"];

    const grouped = clients.map(client => {
      const uploadedTypes = new Set(client.documents.map(d => d.docType));
      const completedChecklistCount = requiredTypes.filter(t => uploadedTypes.has(t)).length;

      return {
        clientId: client.id,
        clientName: client.name,
        pan: client.pan,
        gstin: client.gstin,
        entityType: client.entityType,
        contactPhone: client.contactPhone,
        contactEmail: client.contactEmail,
        totalDocuments: client.documents.length,
        checklistCompleted: completedChecklistCount,
        checklistTotal: requiredTypes.length,
        isChecklistComplete: completedChecklistCount >= requiredTypes.length,
        latestUploadDate: client.documents.length > 0 ? client.documents[0].uploadedAt.toISOString() : null,
        documents: client.documents.map(d => ({
          id: d.id,
          fileName: d.fileName,
          docType: d.docType,
          fileUrl: d.fileUrl,
          uploadedBy: d.uploadedBy,
          uploadedAt: d.uploadedAt.toISOString(),
          status: d.status,
          source: d.source
        }))
      };
    });

    return {
      totalClients: grouped.length,
      data: grouped
    };
  }

  public static async getClientChecklist(clientId: string, user: AuthUser) {
    const requiredTypes: DocType[] = ["PAN", "BANK_STATEMENT", "AADHAAR", "EMAIL_ID"];

    await verifyClientAccess(user, clientId);

    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });
    if (!client) throw new NotFoundError("Client not found");

    const uploadedDocs = await prisma.clientDocument.findMany({
      where: { clientId },
      orderBy: { uploadedAt: "desc" }
    });

    const checklist = requiredTypes.map(type => {
      const matching = uploadedDocs.find(d => d.docType === type);
      return {
        docType: type,
        isCompleted: !!matching,
        document: matching
          ? {
              id: matching.id,
              fileName: matching.fileName,
              fileUrl: matching.fileUrl,
              uploadedAt: matching.uploadedAt.toISOString()
            }
          : null
      };
    });

    const completedCount = checklist.filter(c => c.isCompleted).length;

    return {
      clientId,
      clientName: client.name,
      pan: client.pan,
      completedCount,
      totalRequired: requiredTypes.length,
      isAllCompleted: completedCount >= requiredTypes.length,
      checklist
    };
  }

  public static async uploadDocument(
    clientId: string,
    docType: DocType,
    fileName: string,
    buffer: Buffer,
    source: DocSource,
    documentName: string | undefined,
    user: AuthUser
  ) {
    await verifyClientAccess(user, clientId);

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundError("Client not found");

    const fileUrl = await storageAdapter.saveFile(fileName, buffer);
    const finalDocName = documentName?.trim() || fileName;

    const doc = await prisma.clientDocument.create({
      data: {
        clientId,
        docType,
        fileName: finalDocName,
        fileUrl,
        uploadedBy: user.name,
        source: source || "MANUAL",
        status: "VERIFIED"
      },
      include: {
        client: { select: { id: true, name: true, pan: true } }
      }
    });

    const userExists = user.id ? await prisma.user.findUnique({ where: { id: user.id } }) : null;
    await prisma.auditLog.create({
      data: {
        userId: userExists ? user.id : null,
        action: "DOCUMENT_UPLOADED",
        entityType: "ClientDocument",
        entityId: doc.id,
        after: { docType, fileName: finalDocName, clientId }
      }
    });

    // Check if checklist is now complete
    const checklist = await this.getClientChecklist(clientId, user);
    if (checklist.isAllCompleted) {
      eventBus.publish("DOCUMENT_CHECKLIST_COMPLETED", { clientId });
    }

    return {
      ...doc,
      clientName: doc.client.name,
      uploadedAt: doc.uploadedAt.toISOString()
    };
  }

  /**
   * Retrieves document metadata and absolute file path on disk for secure download or viewing
   */
  public static async getDocumentFile(id: string, user: AuthUser) {
    const doc = await prisma.clientDocument.findUnique({
      where: { id },
      include: { client: { select: { id: true, name: true, contactEmail: true } } }
    });

    if (!doc) throw new NotFoundError("Document not found");

    // Row-level verification
    await verifyClientAccess(user, doc.clientId);

    const safeName = path.basename(doc.fileUrl);
    const filePath = path.join(config.storage.uploadDir, safeName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundError("Physical document file not found on server storage.");
    }

    return {
      doc,
      filePath,
      fileName: doc.fileName
    };
  }

  public static async deleteDocument(id: string, user: AuthUser) {
    const doc = await prisma.clientDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundError("Document not found");

    await verifyClientAccess(user, doc.clientId);

    await storageAdapter.deleteFile(doc.fileUrl);
    await prisma.clientDocument.delete({ where: { id } });

    const userExists = user.id ? await prisma.user.findUnique({ where: { id: user.id } }) : null;
    await prisma.auditLog.create({
      data: {
        userId: userExists ? user.id : null,
        action: "DOCUMENT_DELETED",
        entityType: "ClientDocument",
        entityId: id,
        before: { fileName: doc.fileName, clientId: doc.clientId }
      }
    });

    return { message: "Document deleted successfully", id };
  }
}
