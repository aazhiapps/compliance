import { DocumentModel, DocumentRecord } from "../models/Document";
import { ObjectId } from "mongodb";
import { logger } from "../utils/logger";

/**
 * DocumentRepository handles all database operations for documents
 * Provides type-safe methods for document versioning and metadata
 */

export interface CreateDocumentInput {
  documentId: string;
  clientId?: ObjectId;
  userId?: ObjectId;
  linkedEntityType:
    | "invoice_purchase"
    | "invoice_sales"
    | "filing"
    | "application"
    | "report";
  linkedEntityId: ObjectId;
  documentType:
    | "invoice"
    | "challan"
    | "certificate"
    | "gstr"
    | "report"
    | "other";
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  fileSize: number;
  metadata?: Record<string, any>;
  tags?: string[];
  description?: string;
  createdBy: ObjectId;
}

export interface UpdateDocumentInput {
  fileName?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  description?: string;
  updatedBy?: ObjectId;
}

export interface UploadNewVersionInput {
  fileUrl: string;
  fileSize: number;
  changes: string;
  uploadedBy: ObjectId;
  metadata?: Record<string, any>;
}

export class DocumentRepository {
  /**
   * Create a new document
   */
  async createDocument(data: CreateDocumentInput): Promise<DocumentRecord> {
    try {
      const document = await DocumentModel.create({
        ...data,
        version: 1,
        versionHistory: [],
        mimeType: data.mimeType || "application/octet-stream",
      });

      logger.info("Document created", {
        documentId: document.documentId,
        clientId: data.clientId,
        type: data.documentType,
      });

      return document.toJSON() as DocumentRecord;
    } catch (error) {
      logger.error("Failed to create document", error as Error, { data });
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string): Promise<DocumentRecord | null> {
    try {
      const document = await DocumentModel.findOne({ documentId }).lean();
      return document as DocumentRecord | null;
    } catch (error) {
      logger.error("Failed to get document by ID", error as Error, {
        documentId,
      });
      throw error;
    }
  }

  /**
   * Get all documents for a client
   */
  async getClientDocuments(
    clientId: ObjectId,
    documentType?: string,
    tags?: string[],
  ): Promise<DocumentRecord[]> {
    try {
      const query: Record<string, any> = { clientId };
      if (documentType) {
        query.documentType = documentType;
      }
      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      const documents = await DocumentModel.find(query)
        .sort({ createdAt: -1 })
        .lean();

      return documents as DocumentRecord[];
    } catch (error) {
      logger.error("Failed to get client documents", error as Error, {
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get all documents for a user (applications, reports, etc.)
   */
  async getUserDocuments(userId: ObjectId): Promise<DocumentRecord[]> {
    try {
      const documents = await DocumentModel.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      return documents as DocumentRecord[];
    } catch (error) {
      logger.error("Failed to get user documents", error as Error, { userId });
      throw error;
    }
  }

  /**
   * Get documents linked to an entity (invoice, filing, application, etc.)
   */
  async getLinkedDocuments(
    linkedEntityType: string,
    linkedEntityId: ObjectId,
  ): Promise<DocumentRecord[]> {
    try {
      const documents = await DocumentModel.find({
        linkedEntityType,
        linkedEntityId,
      })
        .sort({ createdAt: -1 })
        .lean();

      return documents as DocumentRecord[];
    } catch (error) {
      logger.error("Failed to get linked documents", error as Error, {
        linkedEntityType,
        linkedEntityId,
      });
      throw error;
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    documentId: string,
    data: UpdateDocumentInput,
  ): Promise<DocumentRecord> {
    try {
      const document = await DocumentModel.findOneAndUpdate(
        { documentId },
        { ...data, updatedAt: new Date() },
        { new: true },
      ).lean();

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      logger.info("Document updated", { documentId });

      return document as DocumentRecord;
    } catch (error) {
      logger.error("Failed to update document", error as Error, { documentId });
      throw error;
    }
  }

  /**
   * Upload a new version of a document
   */
  async uploadNewVersion(
    documentId: string,
    data: UploadNewVersionInput,
  ): Promise<DocumentRecord> {
    try {
      const document = await DocumentModel.findOne({ documentId });

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Create version history entry
      const newVersion = document.version + 1;
      const versionEntry = {
        versionNum: document.version,
        uploadedAt: new Date(),
        uploadedBy: data.uploadedBy,
        changes: data.changes,
        fileSize: (document as any).fileSize,
        s3Path: (document as any).fileUrl,
      };

      // Add to version history
      if (!document.versionHistory) {
        document.versionHistory = [];
      }
      document.versionHistory.push(versionEntry);

      // Update document
      document.version = newVersion;
      (document as any).fileUrl = data.fileUrl;
      (document as any).fileSize = data.fileSize;
      if (data.metadata) {
        (document as any).metadata = { ...document.metadata, ...data.metadata };
      }
      (document as any).updatedBy = data.uploadedBy;
      document.updatedAt = new Date();

      const updated = await document.save();

      logger.info("Document version created", {
        documentId,
        version: newVersion,
        uploadedBy: data.uploadedBy,
      });

      return updated.toJSON() as DocumentRecord;
    } catch (error) {
      logger.error("Failed to upload new version", error as Error, {
        documentId,
      });
      throw error;
    }
  }

  /**
   * Add tags to a document
   */
  async addTags(documentId: string, tags: string[]): Promise<DocumentRecord> {
    try {
      const document = await DocumentModel.findOne({ documentId });

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Add unique tags
      const currentTags = document.tags || [];
      const uniqueTags = new Set([...currentTags, ...tags]);
      document.tags = Array.from(uniqueTags);

      const updated = await document.save();

      logger.info("Tags added to document", { documentId, tags });

      return updated.toJSON() as DocumentRecord;
    } catch (error) {
      logger.error("Failed to add tags", error as Error, { documentId });
      throw error;
    }
  }

  /**
   * Search documents by tags
   */
  async searchByTags(tags: string[]): Promise<DocumentRecord[]> {
    try {
      const documents = await DocumentModel.find({ tags: { $in: tags } })
        .sort({ createdAt: -1 })
        .lean();

      return documents as DocumentRecord[];
    } catch (error) {
      logger.error("Failed to search documents by tags", error as Error, {
        tags,
      });
      throw error;
    }
  }

  /**
   * Search documents by metadata
   */
  async searchByMetadata(
    query: Record<string, any>,
  ): Promise<DocumentRecord[]> {
    try {
      // Build metadata query
      const mongoQuery: Record<string, any> = {};
      for (const [key, value] of Object.entries(query)) {
        mongoQuery[`metadata.${key}`] = value;
      }

      const documents = await DocumentModel.find(mongoQuery)
        .sort({ createdAt: -1 })
        .lean();

      return documents as DocumentRecord[];
    } catch (error) {
      logger.error("Failed to search documents by metadata", error as Error, {
        query,
      });
      throw error;
    }
  }

  /**
   * Delete a document (soft delete - mark as deleted)
   */
  async deleteDocument(documentId: string, deletedBy: ObjectId): Promise<void> {
    try {
      await DocumentModel.updateOne(
        { documentId },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy,
        },
      );

      logger.info("Document deleted", { documentId, deletedBy });
    } catch (error) {
      logger.error("Failed to delete document", error as Error, { documentId });
      throw error;
    }
  }

  /**
   * Restore a soft-deleted document
   */
  async restoreDocument(
    documentId: string,
    restoredBy: ObjectId,
  ): Promise<DocumentRecord> {
    try {
      const document = await DocumentModel.findOneAndUpdate(
        { documentId },
        {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          updatedBy: restoredBy,
          updatedAt: new Date(),
        },
        { new: true },
      ).lean();

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      logger.info("Document restored", { documentId });

      return document as DocumentRecord;
    } catch (error) {
      logger.error("Failed to restore document", error as Error, {
        documentId,
      });
      throw error;
    }
  }

  /**
   * Get document version history
   */
  async getVersionHistory(documentId: string) {
    try {
      const document = await DocumentModel.findOne({ documentId })
        .select("version versionHistory")
        .lean();

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      return {
        currentVersion: document.version,
        history: document.versionHistory || [],
      };
    } catch (error) {
      logger.error("Failed to get version history", error as Error, {
        documentId,
      });
      throw error;
    }
  }

  /**
   * Get document count by type for a client
   */
  async getDocumentStats(clientId: ObjectId) {
    try {
      const stats = await DocumentModel.aggregate([
        { $match: { clientId, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: "$documentType",
            count: { $sum: 1 },
            totalSize: { $sum: "$fileSize" },
          },
        },
      ]);

      return stats;
    } catch (error) {
      logger.error("Failed to get document stats", error as Error, {
        clientId,
      });
      throw error;
    }
  }

  /**
   * Clean up old versions (keep only last N versions)
   */
  async cleanupOldVersions(
    documentId: string,
    keepVersions: number = 5,
  ): Promise<void> {
    try {
      const document = await DocumentModel.findOne({ documentId });

      if (!document || !document.versionHistory) {
        return;
      }

      // Keep only the last N versions
      if (document.versionHistory.length > keepVersions) {
        document.versionHistory = document.versionHistory.slice(-keepVersions);
        await document.save();

        logger.info("Document versions cleaned up", {
          documentId,
          removedVersions: document.versionHistory.length - keepVersions,
        });
      }
    } catch (error) {
      logger.error("Failed to cleanup old versions", error as Error, {
        documentId,
      });
      throw error;
    }
  }
}

export default new DocumentRepository();
