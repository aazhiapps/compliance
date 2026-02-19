import { Parser } from "json2csv";
import { parse } from "csv-parse/sync";

/**
 * CSV Service - Generic utility for CSV import/export operations
 * Handles data transformation, validation, and error reporting
 */

export interface CSVExportOptions {
  fields?: string[];
  transforms?: Record<string, (value: any) => any>;
  withBOM?: boolean;
}

export interface CSVImportOptions {
  columns?: boolean | string[];
  skipEmptyLines?: boolean;
  trim?: boolean;
  castDate?: boolean;
}

export interface CSVImportResult<T> {
  data: T[];
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Export data to CSV format
 */
export function exportToCSV<T>(
  data: T[],
  options: CSVExportOptions = {}
): string {
  const { fields, transforms = {}, withBOM = true } = options;

  // Apply transforms to data
  const transformedData = data.map((item) => {
    const transformed: any = { ...item };
    Object.keys(transforms).forEach((key) => {
      if (key in transformed) {
        transformed[key] = transforms[key](transformed[key]);
      }
    });
    return transformed;
  });

  try {
    const parser = new Parser({ fields, withBOM });
    return parser.parse(transformedData);
  } catch (error) {
    console.error("Error generating CSV:", error);
    throw new Error("Failed to generate CSV export");
  }
}

/**
 * Parse CSV data into objects
 */
export function parseCSV<T>(
  csvContent: string,
  options: CSVImportOptions = {}
): T[] {
  const {
    columns = true,
    skipEmptyLines = true,
    trim = true,
    castDate = false,
  } = options;

  try {
    const records = parse(csvContent, {
      columns,
      skip_empty_lines: skipEmptyLines,
      trim,
      cast: castDate,
      bom: true, // Handle BOM for UTF-8
    });

    return records as T[];
  } catch (error) {
    console.error("Error parsing CSV:", error);
    throw new Error("Failed to parse CSV file");
  }
}

/**
 * Validate and import CSV data with error handling
 */
export function importFromCSV<T>(
  csvContent: string,
  validator: (row: any, index: number) => { valid: boolean; errors: string[] },
  options: CSVImportOptions = {}
): CSVImportResult<T> {
  const errors: CSVImportResult<T>["errors"] = [];
  const validData: T[] = [];

  try {
    const rows = parseCSV<any>(csvContent, options);

    rows.forEach((row, index) => {
      const validation = validator(row, index);

      if (validation.valid) {
        validData.push(row as T);
      } else {
        validation.errors.forEach((errorMsg) => {
          errors.push({
            row: index + 2, // +2 because: +1 for 0-index and +1 for header row
            message: errorMsg,
          });
        });
      }
    });

    return {
      data: validData,
      errors,
      summary: {
        total: rows.length,
        successful: validData.length,
        failed: errors.length,
      },
    };
  } catch (error) {
    throw new Error(`Failed to import CSV: ${(error as Error).message}`);
  }
}

/**
 * Format date to ISO string for CSV export
 */
export function formatDate(date: string | Date | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

/**
 * Format currency for CSV export
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "0.00";
  return amount.toFixed(2);
}

/**
 * Format boolean to Yes/No for CSV export
 */
export function formatBoolean(value: boolean | undefined): string {
  return value ? "Yes" : "No";
}

/**
 * Parse boolean from CSV (handles Yes/No, true/false, 1/0)
 */
export function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  return normalized === "yes" || normalized === "true" || normalized === "1";
}
