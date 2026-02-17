/**
 * GST Validation and Business Logic Utilities
 * Provides validation, due date calculation, and other GST-specific utilities
 */

import { GSTValidationResult, DueDateInfo } from "@shared/gst";

/**
 * Validate GSTIN format and checksum
 * Format: 2 digits (state code) + 10 chars (PAN) + 1 char (entity number) + 1 char (Z) + 1 char (checksum)
 * Example: 27AAPFU0939F1ZV
 */
export function validateGSTIN(gstin: string): GSTValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check length
  if (!gstin || gstin.length !== 15) {
    errors.push("GSTIN must be exactly 15 characters long");
    return { isValid: false, errors, warnings };
  }

  // Check format: 2 digits + 10 alphanumeric (PAN) + 1 digit + Z + 1 alphanumeric
  const gstinPattern =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinPattern.test(gstin)) {
    errors.push("GSTIN format is invalid. Expected format: 22AAAAA0000A1Z5");
  }

  // Extract and validate state code (01-37, 97, 99)
  const stateCode = gstin.substring(0, 2);
  const validStateCodes = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30",
    "31",
    "32",
    "33",
    "34",
    "35",
    "36",
    "37",
    "97",
    "99",
  ];

  if (!validStateCodes.includes(stateCode)) {
    errors.push(`Invalid state code: ${stateCode}`);
  }

  // Extract PAN from GSTIN (characters 3-12)
  const pan = gstin.substring(2, 12);

  // Validate PAN format within GSTIN
  const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panPattern.test(pan)) {
    errors.push("Invalid PAN format within GSTIN");
  }

  // Check 14th character (index 13) is Z
  if (gstin.charAt(13) !== "Z") {
    warnings.push("14th character should be 'Z' for regular taxpayers");
  }

  // Validate checksum (15th character, index 14)
  const checksumChar = gstin.charAt(14);
  const calculatedChecksum = calculateGSTINChecksum(gstin.substring(0, 14));

  if (checksumChar !== calculatedChecksum) {
    errors.push(
      `Invalid checksum. Expected: ${calculatedChecksum}, Got: ${checksumChar}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate GSTIN checksum using modulo 36 algorithm
 */
function calculateGSTINChecksum(gstinWithoutChecksum: string): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let factor = 2;
  let sum = 0;

  for (let i = gstinWithoutChecksum.length - 1; i >= 0; i--) {
    const codePoint = chars.indexOf(gstinWithoutChecksum.charAt(i));
    let addend = factor * codePoint;

    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / 36) + (addend % 36);
    sum += addend;
  }

  const remainder = sum % 36;
  const checkCodePoint = (36 - remainder) % 36;

  return chars.charAt(checkCodePoint);
}

/**
 * Validate PAN format
 * Format: 5 letters + 4 digits + 1 letter
 * Example: AAPFU0939F
 */
export function validatePAN(pan: string): GSTValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pan || pan.length !== 10) {
    errors.push("PAN must be exactly 10 characters long");
    return { isValid: false, errors, warnings };
  }

  const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panPattern.test(pan)) {
    errors.push("Invalid PAN format. Expected format: AAAAA9999A");
  }

  // Check 4th character (type of holder)
  const fourthChar = pan.charAt(3);
  const validTypes: Record<string, string> = {
    P: "Individual/Person",
    C: "Company",
    H: "HUF (Hindu Undivided Family)",
    F: "Firm/Partnership",
    A: "Association of Persons",
    T: "Trust",
    B: "Body of Individuals",
    L: "Local Authority",
    J: "Artificial Juridical Person",
    G: "Government",
  };

  if (!validTypes[fourthChar]) {
    warnings.push(`Unusual 4th character '${fourthChar}' in PAN`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate ARN (Acknowledgement Reference Number) format
 * Format: AA + 2-digit state + 2-digit year + 10-digit number
 * Example: AA270220231234567890
 */
export function validateARN(arn: string): GSTValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!arn || arn.length !== 20) {
    errors.push("ARN must be exactly 20 characters long");
    return { isValid: false, errors, warnings };
  }

  // Check format: AA + 2 digits + 2 digits + 10 digits
  const arnPattern = /^AA[0-9]{2}[0-9]{2}[0-9]{14}$/;
  if (!arnPattern.test(arn)) {
    errors.push("Invalid ARN format. Expected format: AA27022023XXXXXXXXXX");
  }

  // Validate state code
  const stateCode = arn.substring(2, 4);
  const validStateCodes = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30",
    "31",
    "32",
    "33",
    "34",
    "35",
    "36",
    "37",
    "97",
    "99",
  ];

  if (!validStateCodes.includes(stateCode)) {
    warnings.push(`Unusual state code in ARN: ${stateCode}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate due dates for GST returns based on filing frequency
 * Rules:
 * - GSTR-1 (Monthly): 11th of next month
 * - GSTR-3B (Monthly): 20th of next month
 * - GSTR-1 (Quarterly): 13th of month following quarter end
 * - GSTR-3B (Quarterly): 22nd/24th of month following quarter end
 * - GSTR-9 (Annual): 31st December of next financial year
 */
export function calculateDueDates(
  month: string, // YYYY-MM format
  filingFrequency: "monthly" | "quarterly" | "annual",
  _turnover?: number, // Optional: affects quarterly due dates
): DueDateInfo {
  const [year, monthNum] = month.split("-").map(Number);

  let gstr1DueDate: string;
  let gstr3bDueDate: string;
  let gstr9DueDate: string | undefined;
  let isQuarterEnd = false;
  let quarterEndMonth: string | undefined;

  if (filingFrequency === "monthly") {
    // Monthly filing
    // GSTR-1: 11th of next month
    const gstr1Date = new Date(year, monthNum, 11);
    gstr1DueDate = formatDate(gstr1Date);

    // GSTR-3B: 20th of next month
    const gstr3bDate = new Date(year, monthNum, 20);
    gstr3bDueDate = formatDate(gstr3bDate);
  } else if (filingFrequency === "quarterly") {
    // Quarterly filing (QRMP scheme)
    // Check if this is a quarter-end month (Sept, Dec, Mar, June)
    isQuarterEnd = [3, 6, 9, 12].includes(monthNum);

    if (isQuarterEnd) {
      quarterEndMonth = month;

      // GSTR-1: 13th of month following quarter end
      const gstr1Date = new Date(year, monthNum, 13);
      gstr1DueDate = formatDate(gstr1Date);

      // GSTR-3B: 22nd or 24th depending on turnover
      // Turnover <= 5 crores: 24th
      // Turnover > 5 crores: 22nd
      const day = !_turnover || _turnover <= 50000000 ? 24 : 22;
      const gstr3bDate = new Date(year, monthNum, day);
      gstr3bDueDate = formatDate(gstr3bDate);
    } else {
      // For non-quarter-end months in quarterly scheme
      // Only IFF (Invoice Furnishing Facility) filing, not full returns
      // For simplicity, we'll use same dates as monthly
      const gstr1Date = new Date(year, monthNum, 13);
      gstr1DueDate = formatDate(gstr1Date);

      const gstr3bDate = new Date(year, monthNum, 25);
      gstr3bDueDate = formatDate(gstr3bDate);
    }
  } else {
    // Annual filing
    // GSTR-9: 31st December of next financial year
    // Financial year runs from April to March
    let fyEndYear = year;
    if (monthNum >= 4) {
      fyEndYear = year + 1;
    }
    const gstr9Date = new Date(fyEndYear + 1, 11, 31); // December 31st
    gstr9DueDate = formatDate(gstr9Date);

    // For annual, we still need monthly dates for reference
    const gstr1Date = new Date(year, monthNum, 11);
    gstr1DueDate = formatDate(gstr1Date);
    const gstr3bDate = new Date(year, monthNum, 20);
    gstr3bDueDate = formatDate(gstr3bDate);
  }

  // Calculate reminder date (5 days before GSTR-3B due date)
  const reminderDate = new Date(gstr3bDueDate);
  reminderDate.setDate(reminderDate.getDate() - 5);

  return {
    month,
    filingFrequency,
    gstr1DueDate,
    gstr3bDueDate,
    gstr9DueDate,
    isQuarterEnd,
    quarterEndMonth,
    reminderDate: formatDate(reminderDate),
  };
}

/**
 * Calculate late fee based on filing date vs due date
 * Rules:
 * - No late fee if filed on or before due date
 * - GSTR-1: ₹50/day (₹20/day if nil return), max ₹10,000
 * - GSTR-3B: ₹50/day (₹20/day if nil return), max ₹10,000
 * - Late fee per return (separate for GSTR-1 and GSTR-3B)
 */
export function calculateLateFee(
  dueDate: string, // YYYY-MM-DD
  filedDate: string, // YYYY-MM-DD
  isNilReturn: boolean = false,
): number {
  const due = new Date(dueDate);
  const filed = new Date(filedDate);

  // No late fee if filed on time
  if (filed <= due) {
    return 0;
  }

  // Calculate days late
  const daysLate = Math.floor(
    (filed.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Late fee per day
  const feePerDay = isNilReturn ? 20 : 50;

  // Calculate total late fee
  let lateFee = daysLate * feePerDay;

  // Cap at ₹10,000
  const maxFee = 10000;
  lateFee = Math.min(lateFee, maxFee);

  return lateFee;
}

/**
 * Calculate interest on late payment of tax
 * Rule: 18% per annum on the tax amount
 */
export function calculateInterest(
  taxAmount: number,
  dueDate: string, // YYYY-MM-DD
  paidDate: string, // YYYY-MM-DD
): number {
  const due = new Date(dueDate);
  const paid = new Date(paidDate);

  // No interest if paid on time
  if (paid <= due) {
    return 0;
  }

  // Calculate days late
  const daysLate = Math.floor(
    (paid.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Interest rate: 18% per annum = 18/365 per day
  const dailyRate = 0.18 / 365;

  // Calculate interest
  const interest = Math.round(taxAmount * dailyRate * daysLate);

  return interest;
}

/**
 * Check if a month is overdue based on current date
 */
export function isMonthOverdue(
  _month: string, // YYYY-MM
  dueDate: string, // YYYY-MM-DD
  filedDate?: string, // YYYY-MM-DD
): boolean {
  // If already filed, not overdue
  if (filedDate) {
    return false;
  }

  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day

  return today > due;
}

/**
 * Get filing status based on filing state and dates
 */
export function getFilingStatus(
  gstr1Filed: boolean,
  gstr3bFiled: boolean,
  gstr1DueDate?: string,
  gstr3bDueDate?: string,
  gstr1FiledDate?: string,
  gstr3bFiledDate?: string,
): "pending" | "filed" | "late" | "overdue" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Both filed
  if (gstr1Filed && gstr3bFiled) {
    // Check if any was filed late
    if (gstr1FiledDate && gstr1DueDate) {
      const gstr1Filed = new Date(gstr1FiledDate);
      const gstr1Due = new Date(gstr1DueDate);
      if (gstr1Filed > gstr1Due) {
        return "late";
      }
    }
    if (gstr3bFiledDate && gstr3bDueDate) {
      const gstr3bFiled = new Date(gstr3bFiledDate);
      const gstr3bDue = new Date(gstr3bDueDate);
      if (gstr3bFiled > gstr3bDue) {
        return "late";
      }
    }
    return "filed";
  }

  // Check if overdue
  if (gstr3bDueDate) {
    const due = new Date(gstr3bDueDate);
    if (today > due) {
      return "overdue";
    }
  }

  // Pending
  return "pending";
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Extract state name from state code
 */
export function getStateName(stateCode: string): string {
  const stateMap: Record<string, string> = {
    "01": "Jammu and Kashmir",
    "02": "Himachal Pradesh",
    "03": "Punjab",
    "04": "Chandigarh",
    "05": "Uttarakhand",
    "06": "Haryana",
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "11": "Sikkim",
    "12": "Arunachal Pradesh",
    "13": "Nagaland",
    "14": "Manipur",
    "15": "Mizoram",
    "16": "Tripura",
    "17": "Meghalaya",
    "18": "Assam",
    "19": "West Bengal",
    "20": "Jharkhand",
    "21": "Odisha",
    "22": "Chhattisgarh",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "25": "Daman and Diu",
    "26": "Dadra and Nagar Haveli",
    "27": "Maharashtra",
    "28": "Andhra Pradesh (Old)",
    "29": "Karnataka",
    "30": "Goa",
    "31": "Lakshadweep",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "34": "Puducherry",
    "35": "Andaman and Nicobar Islands",
    "36": "Telangana",
    "37": "Andhra Pradesh (New)",
    "97": "Other Territory",
    "99": "Centre Jurisdiction",
  };

  return stateMap[stateCode] || "Unknown State";
}

/**
 * Check if GSTIN state matches provided state
 */
export function validateGSTINState(gstin: string, stateName: string): boolean {
  const stateCode = gstin.substring(0, 2);
  const expectedState = getStateName(stateCode);
  return (
    expectedState.toLowerCase().includes(stateName.toLowerCase()) ||
    stateName.toLowerCase().includes(expectedState.toLowerCase())
  );
}
