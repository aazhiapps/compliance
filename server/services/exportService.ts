import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import { Report } from "@shared/api";

/**
 * Export Service - Reusable utility for generating CSV and PDF exports
 * Designed to be pluggable and support multiple report types
 */

/**
 * Generate CSV export for a report
 * Formats data based on report type with proper currency and date formatting
 */
export function generateCSV(report: Report): string {
  const { reportType, data, clientName, financialYear } = report;

  let fields: string[] = [];
  let csvData: any[] = [];

  // Dynamic CSV structure based on report type
  switch (reportType) {
    case "Financial Statements":
      fields = ["Category", "Amount (₹)"];
      csvData = [
        { Category: "Revenue", "Amount (₹)": formatCurrency(data.revenue) },
        { Category: "Expenses", "Amount (₹)": formatCurrency(data.expenses) },
        { Category: "Profit", "Amount (₹)": formatCurrency(data.profit) },
        { Category: "Assets", "Amount (₹)": formatCurrency(data.assets) },
        {
          Category: "Liabilities",
          "Amount (₹)": formatCurrency(data.liabilities),
        },
      ];
      break;

    case "GST Summary":
      fields = ["Particulars", "Amount (₹)"];
      csvData = [
        {
          Particulars: "Total Sales",
          "Amount (₹)": formatCurrency(data.totalSales),
        },
        {
          Particulars: "Total Purchases",
          "Amount (₹)": formatCurrency(data.totalPurchases),
        },
        {
          Particulars: "Output GST",
          "Amount (₹)": formatCurrency(data.outputGST),
        },
        {
          Particulars: "Input GST",
          "Amount (₹)": formatCurrency(data.inputGST),
        },
        {
          Particulars: "Net GST Payable",
          "Amount (₹)": formatCurrency(data.netGST),
        },
      ];
      break;

    case "Income Tax Computation":
      fields = ["Item", "Amount (₹)"];
      csvData = [
        {
          Item: "Gross Income",
          "Amount (₹)": formatCurrency(data.grossIncome),
        },
        { Item: "Deductions", "Amount (₹)": formatCurrency(data.deductions) },
        {
          Item: "Taxable Income",
          "Amount (₹)": formatCurrency(data.taxableIncome),
        },
        { Item: "Tax Amount", "Amount (₹)": formatCurrency(data.taxAmount) },
      ];
      break;

    case "Tax Audit Summary":
      fields = ["Particulars", "Value"];
      csvData = [
        { Particulars: "Turnover", Value: formatCurrency(data.turnover) },
        {
          Particulars: "Taxable Profit",
          Value: formatCurrency(data.taxableProfit),
        },
        { Particulars: "Tax Paid", Value: formatCurrency(data.taxPaid) },
        {
          Particulars: "Audit Observations",
          Value: data.auditObservations?.join("; ") || "None",
        },
      ];
      break;

    case "ROC Filing Summary":
      fields = ["Particulars", "Details"];
      csvData = [
        {
          Particulars: "Forms Filed",
          Details: data.formsFiled?.join(", ") || "None",
        },
        { Particulars: "Filing Date", Details: formatDate(data.filingDate) },
        {
          Particulars: "Acknowledgments",
          Details: data.acknowledgments?.join(", ") || "None",
        },
      ];
      break;

    default:
      // Generic export for unknown report types
      fields = Object.keys(data);
      csvData = [data];
  }

  // Add header information
  const header = [
    { "Report Information": "Client Name", Value: clientName },
    { "Report Information": "Report Type", Value: reportType },
    { "Report Information": "Financial Year", Value: financialYear },
    {
      "Report Information": "Generated On",
      Value: formatDate(report.generatedOn),
    },
    { "Report Information": "", Value: "" }, // Empty row
  ];

  try {
    // Generate CSV with proper UTF-8 encoding
    const parser = new Parser({ fields, withBOM: true });
    const csv = parser.parse(csvData);

    // Add header to CSV
    const headerParser = new Parser({
      fields: ["Report Information", "Value"],
      withBOM: true,
    });
    const headerCsv = headerParser.parse(header);

    return `${headerCsv}\n\n${csv}`;
  } catch (error) {
    console.error("Error generating CSV:", error);
    throw new Error("Failed to generate CSV export");
  }
}

/**
 * Generate PDF export for a report
 * Creates a professional PDF with firm branding, proper formatting, and signatures
 */
export function generatePDF(report: Report): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];
      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Add watermark based on status
      addWatermark(doc, report.status);

      // Header with firm details
      addHeader(doc, report);

      // Report title
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(report.reportType.toUpperCase(), { align: "center" });

      doc.moveDown();

      // Client details section
      addClientDetails(doc, report);

      doc.moveDown();

      // Report body based on type
      addReportBody(doc, report);

      doc.moveDown(2);

      // Certification section
      addCertification(doc);

      // Footer with page numbers
      addFooter(doc);

      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      reject(new Error("Failed to generate PDF export"));
    }
  });
}

/**
 * Add watermark to PDF based on report status
 */
function addWatermark(doc: PDFKit.PDFDocument, status: string) {
  const watermarkText =
    status === "draft" ? "DRAFT" : status === "final" ? "FINAL" : "FILED";

  doc.save();
  doc
    .fontSize(60)
    .font("Helvetica-Bold")
    .fillColor("#cccccc", 0.3)
    .rotate(-45, { origin: [300, 400] })
    .text(watermarkText, 150, 350, {
      width: 400,
      align: "center",
    });
  doc.restore();
}

/**
 * Add header with firm branding
 */
function addHeader(doc: PDFKit.PDFDocument, report: Report) {
  // Firm details (top left)
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#000000")
    .text("ComplianCe Auditor Services", 50, 50);

  doc
    .fontSize(10)
    .font("Helvetica")
    .text("Chartered Accountants", 50, 68)
    .text("FRN: 012345N", 50, 82)
    .text("Email: info@compliance.com", 50, 96)
    .text("Phone: +91 98765 43210", 50, 110);

  // Add a line separator
  doc.moveTo(50, 130).lineTo(545, 130).stroke();

  doc.moveDown(2);
}

/**
 * Add client details section
 */
function addClientDetails(doc: PDFKit.PDFDocument, report: Report) {
  doc.fontSize(12).font("Helvetica-Bold").text("CLIENT DETAILS", { underline: true });

  doc.fontSize(10).font("Helvetica");
  doc.text(`Client Name: ${report.clientName}`);
  doc.text(`Financial Year: ${report.financialYear}`);
  doc.text(`Report ID: ${report.id}`);
  doc.text(`Generated On: ${formatDate(report.generatedOn)}`);
  doc.text(`Prepared By: ${report.preparedByName || "Admin"}`);
  doc.text(`Status: ${report.status.toUpperCase()}`);
}

/**
 * Add report body with data tables
 */
function addReportBody(doc: PDFKit.PDFDocument, report: Report) {
  doc.fontSize(12).font("Helvetica-Bold").text("REPORT DETAILS", { underline: true });

  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");

  const { reportType, data } = report;

  // Add table based on report type
  switch (reportType) {
    case "Financial Statements":
      addTable(doc, [
        ["Category", "Amount (₹)"],
        ["Revenue", formatCurrency(data.revenue)],
        ["Expenses", formatCurrency(data.expenses)],
        ["Profit", formatCurrency(data.profit)],
        ["Assets", formatCurrency(data.assets)],
        ["Liabilities", formatCurrency(data.liabilities)],
      ]);
      break;

    case "GST Summary":
      addTable(doc, [
        ["Particulars", "Amount (₹)"],
        ["Total Sales", formatCurrency(data.totalSales)],
        ["Total Purchases", formatCurrency(data.totalPurchases)],
        ["Output GST", formatCurrency(data.outputGST)],
        ["Input GST", formatCurrency(data.inputGST)],
        ["Net GST Payable", formatCurrency(data.netGST)],
      ]);
      break;

    case "Income Tax Computation":
      addTable(doc, [
        ["Item", "Amount (₹)"],
        ["Gross Income", formatCurrency(data.grossIncome)],
        ["Deductions", formatCurrency(data.deductions)],
        ["Taxable Income", formatCurrency(data.taxableIncome)],
        ["Tax Amount", formatCurrency(data.taxAmount)],
      ]);
      break;

    case "Tax Audit Summary":
      addTable(doc, [
        ["Particulars", "Value"],
        ["Turnover", formatCurrency(data.turnover)],
        ["Taxable Profit", formatCurrency(data.taxableProfit)],
        ["Tax Paid", formatCurrency(data.taxPaid)],
        [
          "Audit Observations",
          data.auditObservations?.join("; ") || "None",
        ],
      ]);
      break;

    case "ROC Filing Summary":
      addTable(doc, [
        ["Particulars", "Details"],
        ["Forms Filed", data.formsFiled?.join(", ") || "None"],
        ["Filing Date", formatDate(data.filingDate)],
        ["Acknowledgments", data.acknowledgments?.join(", ") || "None"],
      ]);
      break;

    default:
      // Generic table for unknown types
      doc.text("Report Data:", { continued: false });
      doc.text(JSON.stringify(data, null, 2));
  }
}

/**
 * Add a simple table to the PDF
 */
function addTable(
  doc: PDFKit.PDFDocument,
  rows: string[][],
  colWidths = [250, 200]
) {
  const startX = 50;
  let currentY = doc.y;

  rows.forEach((row, rowIndex) => {
    let x = startX;

    row.forEach((cell, colIndex) => {
      const width = colWidths[colIndex];

      // Header row
      if (rowIndex === 0) {
        doc.font("Helvetica-Bold");
      } else {
        doc.font("Helvetica");
      }

      // Draw cell border
      doc.rect(x, currentY, width, 20).stroke();

      // Add text
      doc.text(cell, x + 5, currentY + 5, {
        width: width - 10,
        height: 15,
        ellipsis: true,
      });

      x += width;
    });

    currentY += 20;
    doc.y = currentY;
  });

  doc.moveDown();
}

/**
 * Add certification and signature section
 */
function addCertification(doc: PDFKit.PDFDocument) {
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("CERTIFICATION", { underline: true });

  doc
    .fontSize(9)
    .font("Helvetica")
    .text(
      "This report has been prepared based on the information and documents provided by the client. We certify that the information presented is accurate to the best of our knowledge."
    );

  doc.moveDown(2);

  // Signature block
  doc.fontSize(10).font("Helvetica");
  doc.text("For ComplianCe Auditor Services");
  doc.moveDown(2);
  doc.text("_________________________");
  doc.text("Authorized Signatory");
  doc.text("(CA Name)");
  doc.text("Membership No: XXXXXX");
  doc.text("UDIN: ___________________");
}

/**
 * Add footer with page numbers
 */
function addFooter(doc: PDFKit.PDFDocument) {
  const pages = doc.bufferedPageRange();

  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);

    // Footer text
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(
        `Page ${i + 1} of ${pages.count}`,
        50,
        doc.page.height - 50,
        { align: "center" }
      );
  }
}

/**
 * Format currency to Indian format with 2 decimal places
 */
function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return "0.00";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: string | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}
