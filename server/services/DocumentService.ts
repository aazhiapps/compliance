import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { getS3Service, s3Paths } from "../config/s3";
import DocumentRepository from "../repositories/DocumentRepository";
import { logger } from "../utils/logger";

/**
 * DocumentService handles document operations
 * Including file uploads, downloads, versioning, and metadata extraction
 */

interface UploadDocumentOptions {
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
  tags?: string[];
  description?: string;
  uploadedBy: ObjectId;
}

interface ExtractedMetadata {
  invoiceNumber?: string;
  invoiceDate?: string;
  vendorName?: string;
  vendorGSTIN?: string;
  customerName?: string;
  customerGSTIN?: string;
  amount?: number;
  taxableValue?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  extractedAt: Date;
  [key: string]: any;
}

export class DocumentService {
  private s3Service = getS3Service();

  /**
   * Upload a document file
   */
  async uploadDocument(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    options: UploadDocumentOptions,
  ) {
    try {
      // Generate document ID
      const documentId = uuidv4();

      // Build S3 path based on entity type
      let s3Path: string;
      if (options.clientId) {
        // GST document path
        const now = new Date();
        const fy = `${now.getFullYear()}-${(now.getFullYear() + 1).toString().slice(-2)}`;
        const month = now.toISOString().slice(0, 7);
        s3Path = s3Paths.gstDocument(
          options.clientId.toString(),
          fy,
          month,
          options.documentType,
          documentId,
        );
      } else if (options.userId) {
        // Application document path
        s3Path = s3Paths.application(
          options.userId.toString(),
          options.linkedEntityId.toString(),
          documentId,
        );
      } else {
        throw new Error("Either clientId or userId must be provided");
      }

      // Upload to S3
      const fileUrl = await this.s3Service.uploadFile(
        s3Path,
        fileBuffer,
        mimeType,
        {
          documentId,
          entityType: options.linkedEntityType,
          documentType: options.documentType,
        },
      );

      // Extract metadata (TODO: Implement OCR)
      const metadata = await this.extractMetadata(
        fileBuffer,
        fileName,
        mimeType,
      );

      // Create document record
      const document = await DocumentRepository.createDocument({
        documentId,
        clientId: options.clientId,
        userId: options.userId,
        linkedEntityType: options.linkedEntityType,
        linkedEntityId: options.linkedEntityId,
        documentType: options.documentType,
        fileName,
        fileUrl,
        mimeType,
        fileSize: fileBuffer.length,
        metadata,
        tags: options.tags,
        description: options.description,
        createdBy: options.uploadedBy,
      });

      logger.info("Document uploaded successfully", {
        documentId,
        fileName,
        entityType: options.linkedEntityType,
      });

      return document;
    } catch (error) {
      logger.error("Failed to upload document", error as Error, { fileName });
      throw error;
    }
  }

  /**
   * Download a document
   */
  async downloadDocument(documentId: string, userId?: ObjectId) {
    try {
      // Get document from database
      const document = await DocumentRepository.getDocumentById(documentId);

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Verify access (TODO: Implement proper authorization)
      if (
        userId &&
        document.userId &&
        document.userId.toString() !== userId.toString()
      ) {
        throw new Error("Unauthorized access to document");
      }

      // Download from S3
      const fileBuffer = await this.s3Service.downloadFile(
        document.fileUrl.replace(/^s3:\/\/[^/]+\//, ""),
      );

      logger.info("Document downloaded", { documentId });

      return {
        buffer: fileBuffer,
        fileName: document.fileName,
        mimeType: document.mimeType,
      };
    } catch (error) {
      logger.error("Failed to download document", error as Error, {
        documentId,
      });
      throw error;
    }
  }

  /**
   * Get presigned URL for download
   */
  async getDownloadUrl(documentId: string, expiresIn: number = 3600) {
    try {
      const document = await DocumentRepository.getDocumentById(documentId);

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      const s3Path = document.fileUrl.replace(/^s3:\/\/[^/]+\//, "");
      const presignedUrl = await this.s3Service.getPresignedDownloadUrl(
        s3Path,
        expiresIn,
      );

      logger.info("Presigned download URL generated", { documentId });

      return presignedUrl;
    } catch (error) {
      logger.error("Failed to get download URL", error as Error, {
        documentId,
      });
      throw error;
    }
  }

  /**
   * Update a document with a new version
   */
  async updateDocumentVersion(
    documentId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    changes: string,
    uploadedBy: ObjectId,
  ) {
    try {
      const document = await DocumentRepository.getDocumentById(documentId);

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Build S3 path for new version
      const s3Path = document.fileUrl.replace(/^s3:\/\/[^/]+\//, "");

      // Upload new version to S3
      const fileUrl = await this.s3Service.uploadFile(
        s3Path,
        fileBuffer,
        mimeType,
        {
          documentId,
          version: `v${document.version + 1}`,
        },
      );

      // Extract metadata for new version
      const metadata = await this.extractMetadata(
        fileBuffer,
        fileName,
        mimeType,
      );

      // Update document with new version
      const updated = await DocumentRepository.uploadNewVersion(documentId, {
        fileUrl,
        fileSize: fileBuffer.length,
        changes,
        uploadedBy,
        metadata,
      });

      logger.info("Document version updated", {
        documentId,
        newVersion: updated.version,
      });

      return updated;
    } catch (error) {
      logger.error("Failed to update document version", error as Error, {
        documentId,
      });
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, deletedBy: ObjectId) {
    try {
      const document = await DocumentRepository.getDocumentById(documentId);

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Delete from S3
      try {
        const s3Path = document.fileUrl.replace(/^s3:\/\/[^/]+\//, "");
        await this.s3Service.deleteFile(s3Path);
      } catch (error) {
        logger.warn("Failed to delete file from S3", error as Error, {
          documentId,
        });
        // Continue - soft delete the record anyway
      }

      // Soft delete the document record
      await DocumentRepository.deleteDocument(documentId, deletedBy);

      logger.info("Document deleted", { documentId });
    } catch (error) {
      logger.error("Failed to delete document", error as Error, { documentId });
      throw error;
    }
  }

  /**
   * Extract metadata from document using OCR
   * TODO: Implement actual OCR using Tesseract.js or AWS Textract
   */
  private async extractMetadata(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<ExtractedMetadata> {
    try {
      // For now, extract basic metadata from file name and type
      const metadata: ExtractedMetadata = {
        extractedAt: new Date(),
      };

      // Try to extract invoice number from filename
      const invoiceMatch = fileName.match(/(\d+|[A-Z]+\d+)/i);
      if (invoiceMatch) {
        metadata.invoiceNumber = invoiceMatch[1];
      }

      // TODO: Implement actual OCR
      // const ocrResult = await performOCR(fileBuffer);
      // metadata = { ...metadata, ...ocrResult };

      return metadata;
    } catch (error) {
      logger.warn("Failed to extract metadata", error as Error, { fileName });
      // Return basic metadata even if extraction fails
      return {
        extractedAt: new Date(),
      };
    }
  }

  /**
   * Search documents by query
   */
  async searchDocuments(query: {
    clientId?: ObjectId;
    documentType?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }) {
    try {
      let results = [];

      if (query.clientId) {
        results = await DocumentRepository.getClientDocuments(
          query.clientId,
          query.documentType,
          query.tags,
        );
      } else if (query.metadata) {
        results = await DocumentRepository.searchByMetadata(query.metadata);
      } else if (query.tags) {
        results = await DocumentRepository.searchByTags(query.tags);
      }

      return results;
    } catch (error) {
      logger.error("Failed to search documents", error as Error, { query });
      throw error;
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(clientId: ObjectId) {
    try {
      const stats = await DocumentRepository.getDocumentStats(clientId);

      return {
        byType: stats,
        totalDocuments: stats.reduce((sum, stat) => sum + stat.count, 0),
        totalSize: stats.reduce((sum, stat) => sum + stat.totalSize, 0),
      };
    } catch (error) {
      logger.error("Failed to get document stats", error as Error, {
        clientId,
      });
      throw error;
    }
  }

  /**
   * Get version history of a document
   */
  async getVersionHistory(documentId: string) {
    try {
      const history = await DocumentRepository.getVersionHistory(documentId);
      return history;
    } catch (error) {
      logger.error("Failed to get version history", error as Error, {
        documentId,
      });
      throw error;
    }
  }
}

export default new DocumentService();
