import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * File storage utilities for GST documents
 * Manages local file storage with organized folder structure
 */

// Base directory for GST data storage
const GST_DATA_BASE =
  process.env.GST_DATA_PATH || path.join(process.cwd(), "GST_DATA");

/**
 * Generate folder path for a client's GST data
 * Structure: /GST_DATA/{ClientName}/{FinancialYear}/{Month}/
 */
export function getGSTFolderPath(
  clientName: string,
  financialYear: string,
  month: string,
  subfolder: "Purchases" | "Sales" | "Returns" | "Challans",
): string {
  // Sanitize client name for file system
  const sanitizedClientName = sanitizeFileName(clientName);
  return path.join(
    GST_DATA_BASE,
    sanitizedClientName,
    financialYear,
    month,
    subfolder,
  );
}

/**
 * Ensure directory exists, create if not
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Sanitize file name to remove invalid characters
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9_\-\.]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Generate unique file name to prevent duplicates
 * Format: {ClientName}_{Month}_{InvoiceNo}_{Type}_{hash}.{ext}
 */
export function generateFileName(
  clientName: string,
  month: string,
  invoiceNo: string,
  type: string,
  originalName: string,
): string {
  const sanitizedClient = sanitizeFileName(clientName);
  const sanitizedInvoice = sanitizeFileName(invoiceNo);
  const sanitizedType = sanitizeFileName(type);
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(4).toString("hex");

  return `${sanitizedClient}_${month}_${sanitizedInvoice}_${sanitizedType}_${hash}${ext}`;
}

/**
 * Save file to GST storage
 */
export async function saveGSTFile(
  clientName: string,
  financialYear: string,
  month: string,
  subfolder: "Purchases" | "Sales" | "Returns" | "Challans",
  invoiceNo: string,
  type: string,
  fileBuffer: Buffer,
  originalName: string,
): Promise<string> {
  // Get folder path
  const folderPath = getGSTFolderPath(
    clientName,
    financialYear,
    month,
    subfolder,
  );

  // Ensure directory exists
  await ensureDirectory(folderPath);

  // Generate unique file name
  const fileName = generateFileName(
    clientName,
    month,
    invoiceNo,
    type,
    originalName,
  );
  const filePath = path.join(folderPath, fileName);

  // Check if file already exists
  try {
    await fs.access(filePath);
    throw new Error(`File already exists: ${fileName}`);
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  // Write file
  await fs.writeFile(filePath, fileBuffer);

  // Return relative path from GST_DATA_BASE
  return path.relative(GST_DATA_BASE, filePath);
}

/**
 * Read file from GST storage
 */
export async function readGSTFile(relativePath: string): Promise<Buffer> {
  const filePath = path.join(GST_DATA_BASE, relativePath);
  return await fs.readFile(filePath);
}

/**
 * Delete file from GST storage
 */
export async function deleteGSTFile(relativePath: string): Promise<void> {
  const filePath = path.join(GST_DATA_BASE, relativePath);
  await fs.unlink(filePath);
}

/**
 * Check if file exists
 */
export async function fileExists(relativePath: string): Promise<boolean> {
  try {
    const filePath = path.join(GST_DATA_BASE, relativePath);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List files in a directory
 */
export async function listFiles(
  clientName: string,
  financialYear: string,
  month: string,
  subfolder: "Purchases" | "Sales" | "Returns" | "Challans",
): Promise<string[]> {
  const folderPath = getGSTFolderPath(
    clientName,
    financialYear,
    month,
    subfolder,
  );

  try {
    const files = await fs.readdir(folderPath);
    return files;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(relativePath: string): Promise<{
  size: number;
  created: Date;
  modified: Date;
}> {
  const filePath = path.join(GST_DATA_BASE, relativePath);
  const stats = await fs.stat(filePath);

  return {
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime,
  };
}

/**
 * Create backup of GST data for a client
 */
export async function backupClientData(
  clientName: string,
  financialYear: string,
): Promise<string> {
  const sanitizedClient = sanitizeFileName(clientName);
  const sourcePath = path.join(GST_DATA_BASE, sanitizedClient, financialYear);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    GST_DATA_BASE,
    "backups",
    `${sanitizedClient}_${financialYear}_${timestamp}`,
  );

  // Ensure backup directory exists
  await ensureDirectory(path.join(GST_DATA_BASE, "backups"));

  // Copy directory recursively
  await copyDirectory(sourcePath, backupPath);

  return backupPath;
}

/**
 * Copy directory recursively
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await ensureDirectory(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}
