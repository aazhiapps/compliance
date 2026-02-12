# GST Filing Tracking Module

## Overview

A comprehensive GST (Goods and Services Tax) Filing Tracking Module for managing client GST compliance, purchase and sales invoices, and return filing status.

## Features

### 1. Client Management
- Create and manage GST clients with complete business details
- Track GSTIN, PAN, filing frequency, and financial year
- Support for monthly, quarterly, and annual filing frequencies
- Client-wise data segregation

### 2. Purchase Invoice Tracking
- Add, edit, and delete purchase invoices
- Capture vendor details including GSTIN
- Auto-calculate:
  - Total amount (Taxable + CGST + SGST + IGST)
  - Monthly purchase totals
  - Input Tax Credit (ITC) available
- Month-wise and client-wise filtering
- Document upload support (planned)

### 3. Sales Invoice Tracking
- Add, edit, and delete sales invoices
- Capture customer details including GSTIN
- Auto-calculate:
  - Total amount (Taxable + CGST + SGST + IGST)
  - Monthly sales totals
  - Output tax liability
- Month-wise and client-wise filtering
- Document upload support (planned)

### 4. GST Return Filing Status
- Track GSTR-1 (Outward Supplies) filing status
- Track GSTR-3B (Summary Return) filing status
- Capture:
  - Filing dates
  - ARN (Acknowledgement Reference Number)
  - Tax paid
  - Late fees
  - Interest
- Upload filed returns, challans, and working sheets (planned)
- Status indicators (Pending/Filed/Late)

### 5. Monthly Dashboard
- Comprehensive monthly summary showing:
  - Total purchases
  - Total sales
  - ITC available
  - Output tax
  - Net tax payable
  - Filing status indicators
- Visual status badges for GSTR-1 and GSTR-3B
- Real-time calculations

### 6. File Storage System
- Organized folder structure:
  ```
  /GST_DATA/{ClientName}/{FinancialYear}/{Month}/
      ├── Purchases/
      ├── Sales/
      ├── Returns/
      └── Challans/
  ```
- Automated folder creation
- Unique file naming convention
- Duplicate prevention
- File metadata tracking

### 7. Security & Permissions
- **Admin**: Full access (Add/Edit/Delete/Update status)
- **Accountant**: Add/Edit + Upload files (No deletion of filed records)
- **Client (View Only)**: View dashboard + Download returns
- Audit logging for all changes
- JWT-based authentication

## Technical Architecture

### Backend Structure

```
server/
├── repositories/
│   └── gstRepository.ts       # Data management
├── routes/
│   └── gst.ts                  # API endpoints
└── utils/
    └── fileStorage.ts          # File management utilities
```

### Frontend Structure

```
client/
├── pages/
│   └── AdminGST.tsx            # Main GST page
└── components/gst/
    ├── ClientSelector.tsx      # Client selection dropdown
    ├── ClientForm.tsx          # Add/Edit client form
    ├── PurchaseInvoices.tsx    # Purchase tracking
    ├── SalesInvoices.tsx       # Sales tracking
    ├── FilingStatus.tsx        # Filing status management
    ├── MonthlySummary.tsx      # Dashboard summary
    └── InvoiceForm.tsx         # Invoice add/edit form
```

### Shared Types

```
shared/
└── gst.ts                      # Type definitions
```

## API Endpoints

### Client Management
- `POST /api/gst/clients` - Create GST client
- `GET /api/gst/clients` - List all clients (filtered by role)
- `GET /api/gst/clients/:id` - Get single client
- `PATCH /api/gst/clients/:id` - Update client

### Purchase Invoices
- `POST /api/gst/purchases` - Create purchase invoice
- `GET /api/gst/purchases/:clientId?month=YYYY-MM` - Get purchase invoices
- `PATCH /api/gst/purchases/:id` - Update purchase invoice
- `DELETE /api/gst/purchases/:id` - Delete purchase invoice (admin only)

### Sales Invoices
- `POST /api/gst/sales` - Create sales invoice
- `GET /api/gst/sales/:clientId?month=YYYY-MM` - Get sales invoices
- `PATCH /api/gst/sales/:id` - Update sales invoice
- `DELETE /api/gst/sales/:id` - Delete sales invoice (admin only)

### GST Filing
- `POST /api/gst/filings` - Update filing status
- `GET /api/gst/filings/:clientId?financialYear=YYYY-YY` - Get filing records

### Reports
- `GET /api/gst/summary/:clientId/:month` - Get monthly summary

### Documents (Planned)
- `POST /api/gst/documents` - Upload document
- `GET /api/gst/documents/:path` - Download document

## Usage Guide

### 1. Create a GST Client

Navigate to Admin > GST Filing and click "Add GST Client"

Required information:
- Client Name
- GSTIN (15 characters)
- PAN Number (10 characters)
- Business Name
- Filing Frequency (Monthly/Quarterly/Annual)
- Financial Year Start Date
- Address and State
- Contact Person details

### 2. Add Purchase Invoices

1. Select a client from the dropdown
2. Choose the month
3. Navigate to "Purchases" tab
4. Click "Add Purchase"
5. Fill in:
   - Invoice Number
   - Vendor Name and GSTIN
   - Invoice Date
   - Taxable Amount
   - CGST, SGST, IGST amounts

Total amount is auto-calculated.

### 3. Add Sales Invoices

1. Select a client from the dropdown
2. Choose the month
3. Navigate to "Sales" tab
4. Click "Add Sale"
5. Fill in:
   - Invoice Number
   - Customer Name and GSTIN
   - Invoice Date
   - Taxable Amount
   - CGST, SGST, IGST amounts

Total amount is auto-calculated.

### 4. Update Filing Status

1. Select a client from the dropdown
2. Choose the month
3. Navigate to "Filing Status" tab
4. Mark GSTR-1 and/or GSTR-3B as filed
5. Enter:
   - Filing Date
   - ARN Number
   - Tax Paid
   - Late Fee (if any)
   - Interest (if any)
6. Click "Save Changes"

### 5. View Monthly Summary

The monthly summary is automatically displayed when you select a client and month. It shows:
- Total purchases and sales
- ITC available and output tax
- Net tax payable
- Filing status indicators

## Data Models

### GSTClient
```typescript
{
  id: string
  userId: string
  clientName: string
  gstin: string  // 15 characters
  businessName: string
  filingFrequency: "monthly" | "quarterly" | "annual"
  financialYearStart: string  // YYYY-MM-DD
  panNumber: string  // 10 characters
  address: string
  state: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  createdAt: string
  updatedAt: string
}
```

### PurchaseInvoice / SalesInvoice
```typescript
{
  id: string
  clientId: string
  invoiceNumber: string
  vendorName/customerName: string
  vendorGSTIN/customerGSTIN: string
  invoiceDate: string  // YYYY-MM-DD
  taxableAmount: number
  cgst: number
  sgst: number
  igst: number
  totalAmount: number  // auto-calculated
  documents: string[]
  month: string  // YYYY-MM
  financialYear: string  // e.g., "2024-25"
  createdAt: string
  updatedAt: string
  createdBy: string
}
```

### GSTReturnFiling
```typescript
{
  id: string
  clientId: string
  month: string  // YYYY-MM
  financialYear: string
  gstr1Filed: boolean
  gstr1FiledDate?: string
  gstr1ARN?: string
  gstr3bFiled: boolean
  gstr3bFiledDate?: string
  gstr3bARN?: string
  taxPaid: number
  lateFee: number
  interest: number
  filingStatus: "pending" | "filed" | "late"
  returnDocuments: string[]
  challanDocuments: string[]
  workingSheets: string[]
  createdAt: string
  updatedAt: string
  updatedBy: string
}
```

## Future Enhancements

### Short Term
1. ✅ Implement actual file upload with multipart/form-data
2. ✅ Add file download functionality
3. ✅ Add year-wise dashboard view
4. ✅ Export reports to PDF/Excel

### Medium Term
1. ⏳ ITC ledger with month-on-month carry forward
2. ⏳ Automated late fee calculation
3. ⏳ Email/SMS reminders for filing due dates
4. ⏳ GSTR-2A reconciliation
5. ⏳ Bulk invoice upload via Excel

### Long Term
1. 🔜 Integration with GST portal
2. 🔜 Automated return filing
3. 🔜 E-way bill management
4. 🔜 TDS tracking
5. 🔜 Advanced analytics and insights

## Testing

### Manual Testing Checklist

- [ ] Create a new GST client
- [ ] Add purchase invoices for a month
- [ ] Add sales invoices for a month
- [ ] Verify monthly summary calculations
- [ ] Update filing status
- [ ] Test edit/delete operations
- [ ] Verify role-based access (admin vs non-admin)
- [ ] Test with multiple clients
- [ ] Test with different months
- [ ] Verify audit logs are created

### API Testing

Use tools like Postman or curl to test API endpoints:

```bash
# Get authentication token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@1234"}'

# Create GST client
curl -X POST http://localhost:8080/api/gst/clients \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...client data...}'
```

## Troubleshooting

### Common Issues

1. **"Client not found" error**
   - Verify you're using the correct client ID
   - Check if the client exists in the database

2. **"Access denied" error**
   - Verify JWT token is valid
   - Check user role permissions

3. **Calculation errors**
   - Ensure all tax amounts are numeric
   - Verify CGST + SGST + IGST calculations

4. **File upload issues** (when implemented)
   - Check file size limits (max 10MB)
   - Verify file type is allowed
   - Ensure GST_DATA directory has write permissions

## Contributing

When contributing to the GST module:

1. Follow existing code patterns
2. Add TypeScript types for new features
3. Update this README for new functionality
4. Test with multiple scenarios
5. Ensure role-based access control is maintained

## Support

For issues or questions about the GST Filing Tracking Module:
- Check the main README.md
- Review API endpoint documentation
- Check browser console for errors
- Review server logs for backend issues

## License

This module is part of the ComplianCe platform and follows the same license terms.
