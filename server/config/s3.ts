import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * AWS S3 Configuration
 * Set env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME
 */

const s3Config = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

const S3_BUCKET = process.env.S3_BUCKET_NAME || "gst-compliance-bucket";

// Initialize S3 client
export const s3Client = new S3Client(s3Config);

/**
 * S3 Folder structure:
 * s3://bucket/gst/{clientId}/fy-{financialYear}/month-{month}/{documentType}/{documentId}.pdf
 */

export const s3Paths = {
  /**
   * Build path for GST document
   */
  gstDocument: (
    clientId: string,
    fy: string,
    month: string,
    type: string,
    documentId: string,
  ) => `gst/${clientId}/fy-${fy}/month-${month}/${type}/${documentId}`,

  /**
   * Build path for invoice document
   */
  invoice: (
    clientId: string,
    invoiceType: "purchase" | "sales",
    invoiceId: string,
  ) => `gst/${clientId}/invoices/${invoiceType}/${invoiceId}`,

  /**
   * Build path for application document
   */
  application: (userId: string, applicationId: string, documentId: string) =>
    `applications/${userId}/${applicationId}/${documentId}`,

  /**
   * Build path for report
   */
  report: (clientId: string, reportId: string) =>
    `reports/${clientId}/${reportId}`,

  /**
   * Build path for user avatar
   */
  avatar: (userId: string, fileName: string) => `avatars/${userId}/${fileName}`,
};

/**
 * S3 Upload Service
 */
export const s3Service = {
  /**
   * Upload file to S3
   */
  async uploadFile(
    key: string,
    body: Buffer | Blob,
    contentType: string = "application/octet-stream",
    metadata?: Record<string, string>,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: metadata,
        ServerSideEncryption: "AES256",
      });

      await s3Client.send(command);
      return `s3://${S3_BUCKET}/${key}`;
    } catch (error) {
      console.error("S3 upload error:", error);
      throw new Error(`Failed to upload file to S3: ${error}`);
    }
  },

  /**
   * Download file from S3
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });

      const response = await s3Client.send(command);
      const chunks: Uint8Array[] = [];

      if (response.Body) {
        const stream = response.Body as AsyncIterable<Uint8Array>;
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error("S3 download error:", error);
      throw new Error(`Failed to download file from S3: ${error}`);
    }
  },

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error("S3 delete error:", error);
      throw new Error(`Failed to delete file from S3: ${error}`);
    }
  },

  /**
   * Generate presigned URL for file access (download)
   * Default expiry: 1 hour (3600 seconds)
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error("S3 presigned URL error:", error);
      throw new Error(`Failed to generate presigned URL: ${error}`);
    }
  },

  /**
   * Generate presigned URL for file upload (PUT)
   * Default expiry: 15 minutes (900 seconds)
   */
  async getPresignedUploadUrl(
    key: string,
    expiresIn: number = 900,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error("S3 presigned upload URL error:", error);
      throw new Error(`Failed to generate presigned upload URL: ${error}`);
    }
  },

  /**
   * List files in a prefix (folder)
   */
  async listFiles(prefix: string, maxKeys: number = 100): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await s3Client.send(command);
      return response.Contents?.map((item) => item.Key || "") || [];
    } catch (error) {
      console.error("S3 list files error:", error);
      return [];
    }
  },

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const files = await s3Service.listFiles(key, 1);
      return files.length > 0;
    } catch {
      return false;
    }
  },
};

/**
 * S3 Mock Service (for development without AWS credentials)
 * Replace s3Service with s3MockService in development if needed
 */
export const s3MockService = {
  // Mock storage in memory
  mockStorage: new Map<string, Buffer>(),

  async uploadFile(
    key: string,
    body: Buffer | Blob,
    _contentType: string = "application/octet-stream",
  ): Promise<string> {
    const buffer = Buffer.isBuffer(body)
      ? body
      : Buffer.from(await body.arrayBuffer());
    this.mockStorage.set(key, buffer);
    console.log(`[MOCK S3] Uploaded ${key}`);
    return `s3://${S3_BUCKET}/${key}`;
  },

  async downloadFile(key: string): Promise<Buffer> {
    const buffer = this.mockStorage.get(key);
    if (!buffer) throw new Error(`File not found: ${key}`);
    return buffer;
  },

  async deleteFile(key: string): Promise<void> {
    this.mockStorage.delete(key);
    console.log(`[MOCK S3] Deleted ${key}`);
  },

  async getPresignedDownloadUrl(key: string): Promise<string> {
    return `/api/documents/download?key=${encodeURIComponent(key)}`;
  },

  async getPresignedUploadUrl(key: string): Promise<string> {
    return `/api/documents/upload?key=${encodeURIComponent(key)}`;
  },

  async listFiles(prefix: string, maxKeys: number = 100): Promise<string[]> {
    const keys = Array.from(this.mockStorage.keys());
    return keys.filter((k) => k.startsWith(prefix)).slice(0, maxKeys);
  },

  async fileExists(key: string): Promise<boolean> {
    return this.mockStorage.has(key);
  },
};

// Export mock service if in development and no AWS credentials
export const getS3Service = () => {
  if (
    process.env.NODE_ENV === "development" &&
    (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
  ) {
    console.log("Using mock S3 service (development mode)");
    return s3MockService;
  }
  return s3Service;
};

export default s3Service;
