import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import multer from "multer";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin, requireStaff } from "../middleware/admin";
import DocumentService from "../services/DocumentService";
import DocumentRepository from "../repositories/DocumentRepository";
import { logger } from "../utils/logger";

const router = Router();

// Configure multer for file uploads (in-memory for S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

/**
 * POST /api/documents/upload
 * Upload a new document
 * Requires: Authentication
 */
router.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const {
        linkedEntityType,
        linkedEntityId,
        documentType,
        clientId,
        tags,
        description,
      } = req.body;
      const userId = (req as any).userId;

      // Validate required fields
      if (!linkedEntityType || !linkedEntityId || !documentType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Upload document
      const document = await DocumentService.uploadDocument(
        file.buffer,
        file.originalname,
        file.mimetype,
        {
          clientId: clientId ? new ObjectId(clientId) : undefined,
          userId: new ObjectId(userId),
          linkedEntityType,
          linkedEntityId: new ObjectId(linkedEntityId),
          documentType,
          tags: tags ? tags.split(",") : undefined,
          description,
          uploadedBy: new ObjectId(userId),
        },
      );

      logger.info("Document uploaded via API", {
        correlationId: (req as any).correlationId,
        documentId: document.id,
        fileName: file.originalname,
      });

      res.status(201).json(document);
    } catch (error) {
      logger.error("Failed to upload document", error as Error, {
        correlationId: (req as any).correlationId,
      });
      res.status(500).json({ error: "Failed to upload document" });
    }
  },
);

/**
 * GET /api/documents/:documentId/download
 * Download a document
 */
router.get(
  "/:documentId/download",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      const userId = (req as any).userId;

      const result = await DocumentService.downloadDocument(
        documentId,
        new ObjectId(userId),
      );

      res.setHeader("Content-Type", result.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.fileName}"`,
      );
      res.send(result.buffer);

      logger.info("Document downloaded via API", {
        correlationId: (req as any).correlationId,
        documentId,
      });
    } catch (error) {
      logger.error("Failed to download document", error as Error, {
        correlationId: (req as any).correlationId,
      });
      res.status(500).json({ error: "Failed to download document" });
    }
  },
);

/**
 * GET /api/documents/:documentId/download-url
 * Get presigned URL for document download
 */
router.get(
  "/:documentId/download-url",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      const { expiresIn = 3600 } = req.query;

      const url = await DocumentService.getDownloadUrl(
        documentId,
        parseInt(expiresIn as string),
      );

      res.json({ url, expiresIn: parseInt(expiresIn as string) });
    } catch (error) {
      logger.error("Failed to get download URL", error as Error, {
        correlationId: (req as any).correlationId,
      });
      res.status(500).json({ error: "Failed to get download URL" });
    }
  },
);

/**
 * GET /api/documents/:documentId
 * Get document details
 */
router.get(
  "/:documentId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;

      const document = await DocumentRepository.getDocumentById(documentId);

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.json(document);
    } catch (error) {
      logger.error("Failed to get document", error as Error, {
        correlationId: (req as any).correlationId,
      });
      res.status(500).json({ error: "Failed to get document" });
    }
  },
);

/**
 * GET /api/documents/client/:clientId
 * Get all documents for a client
 */
router.get(
  "/client/:clientId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const { documentType, tags } = req.query;

      const documents = await DocumentRepository.getClientDocuments(
        new ObjectId(clientId),
        documentType as string,
        tags ? (tags as string).split(",") : undefined,
      );

      res.json(documents);
    } catch (error) {
      logger.error("Failed to get client documents", error as Error, {
        correlationId: (req as any).correlationId,
      });
      res.status(500).json({ error: "Failed to get client documents" });
    }
  },
);

/**
 * GET /api/documents/entity/:entityType/:entityId
 * Get documents linked to an entity
 */
router.get(
  "/entity/:entityType/:entityId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.params;

      const documents = await DocumentRepository.getLinkedDocuments(
        entityType,
        new ObjectId(entityId),
      );

      res.json(documents);
    } catch (error) {
      logger.error("Failed to get linked documents", error as Error, {
        correlationId: (req as any).correlationId,
      });
      res.status(500).json({ error: "Failed to get linked documents" });
    }
  },
);

/**
 * POST /api/documents/:documentId/version
 * Upload a new version of a document
 */
router.post(
  "/:documentId/version",
  authenticateToken,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { documentId } = req.params;
      const { changes } = req.body;
      const userId = (req as any).userId;

      if (!changes) {
        return res.status(400).json({ error: "Missing changes description" });
      }

      const updated = await DocumentService.updateDocumentVersion(
        documentId,
        file.buffer,
        file.originalname,
        file.mimetype,
        changes,
        new ObjectId(userId),
      );

      logger.info("Document version uploaded via API", {
        correlationId: (req as any).correlationId,
        documentId,
        newVersion: updated.version,
      });

      res.json(updated);
    } catch (error) {
      logger.error("Failed to upload document version", error as Error, {
        correlationId: (req as any).correlationId,
      });
      res.status(500).json({ error: "Failed to upload document version" });
    }
  },
);

/**
 * GET /api/documents/:documentId/versions
 * Get version history of a document
 */
router.get(
  "/:documentId/versions",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;

      const history = await DocumentService.getVersionHistory(documentId);

      res.json(history);
    } catch (error) {
      logger.error("Failed to get version history", error as Error, {
        correlationId: (req as any).correlationId,
      });
      res.status(500).json({ error: "Failed to get version history" });
    }
  },
);

/**
 * PATCH /api/documents/:documentId
 * Update document metadata
 */
router.patch(
  "/:documentId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      const { tags, description, fileName } = req.body;
      const userId = (req as any).userId;

      const updated = await DocumentRepository.updateDocument(documentId, {
        fileName,
        tags,
        description,
        updatedBy: new ObjectId(userId),
      });

      logger.info("Document metadata updated via API", {
        correlationId: (req as any).correlationId,
        documentId,
      });

      res.json(updated);
    } catch (error) {
      logger.error("Failed to update document", error as Error, {
        correlationId: (req as any).correlationId,
      });
      res.status(500).json({ error: "Failed to update document" });
    }
  },
);

/**
 * POST /api/documents/:documentId/tags
 * Add tags to a document
 */
router.post(
  "/:documentId/tags",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      const { tags } = req.body;

      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({ error: "Invalid tags provided" });
      }

      const updated = await DocumentRepository.addTags(documentId, tags);

      res.json(updated);
    } catch (error) {
      logger.error("Failed to add tags", error as Error, {
        correlationId: (req as any).correlationId,
      });
      res.status(500).json({ error: "Failed to add tags" });
    }
  },
);

/**
 * DELETE /api/documents/:documentId
 * Delete a document (soft delete)
 */
router.delete(
  "/:documentId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      const userId = (req as any).userId;

      await DocumentService.deleteDocument(documentId, new ObjectId(userId));

      logger.info("Document deleted via API", {
        correlationId: (req as any).correlationId,
        documentId,
      });

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      logger.error("Failed to delete document", error as Error, {
        correlationId: (req as any).correlationId,
      });
      res.status(500).json({ error: "Failed to delete document" });
    }
  },
);

/**
 * GET /api/documents/search
 * Search documents
 */
router.get(
  "/search",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { clientId, documentType, tags, metadata } = req.query;

      const results = await DocumentService.searchDocuments({
        clientId: clientId ? new ObjectId(clientId as string) : undefined,
        documentType: documentType as string,
        tags: tags ? (tags as string).split(",") : undefined,
        metadata: metadata ? JSON.parse(metadata as string) : undefined,
      });

      res.json(results);
    } catch (error) {
      logger.error("Failed to search documents", error as Error, {
        correlationId: (req as any).correlationId,
      });
      res.status(500).json({ error: "Failed to search documents" });
    }
  },
);

/**
 * GET /api/documents/stats/:clientId
 * Get document statistics for a client
 */
router.get(
  "/stats/:clientId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;

      const stats = await DocumentService.getDocumentStats(
        new ObjectId(clientId),
      );

      res.json(stats);
    } catch (error) {
      logger.error("Failed to get document stats", error as Error, {
        correlationId: (req as any).correlationId,
      });
      res.status(500).json({ error: "Failed to get document stats" });
    }
  },
);

export default router;
