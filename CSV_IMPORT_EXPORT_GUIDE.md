# CSV Import/Export Feature Documentation

## Overview
The compliance application now supports CSV import/export functionality for all major entities in the admin dashboard. This feature enables bulk data operations, backup/restore, and data migration scenarios.

## Features

### Export Capabilities
Administrators can export the following data to CSV format:
- **Users**: Complete user database with roles, business types, and verification status
- **Clients**: All client profiles with KYC, PAN, GSTIN information
- **Applications**: Service applications with status and notes
- **Payments**: Payment records with transaction details
- **GST Sales Invoices**: Sales invoices for specific GST clients
- **GST Purchase Invoices**: Purchase invoices for specific GST clients

### Import Capabilities
Administrators can import the following data from CSV files:
- **Users**: Bulk user creation with validation
- **Clients**: Bulk client onboarding
- **Applications**: Bulk application submission

### Key Features
- ✅ **One-Click Export**: Download data instantly with proper formatting
- ✅ **Template Downloads**: Get pre-formatted CSV templates with example data
- ✅ **Real-time Validation**: Immediate feedback on data quality during import
- ✅ **Error Reporting**: Detailed row-level error messages with line numbers
- ✅ **UTF-8 Support**: Proper encoding with BOM for international characters
- ✅ **Secure Upload**: File size limits (10MB) and authentication required
- ✅ **Indian Formatting**: Currency in ₹ format, proper date formatting

## Usage Guide

### Exporting Data

1. **Navigate to Admin Page**: Go to the admin section (Users, Clients, Applications, or Payments)
2. **Click Export Button**: Look for the "Export" button in the page header
3. **Download Complete**: CSV file downloads automatically to your browser

**Example Export Button Locations:**
- Admin Users: Top-right header next to "Add Customer"
- Admin Clients: Top-right header
- Admin Applications: Top-right header
- Admin Payments: Top-right header

### Importing Data

1. **Click Import Button**: Located next to Export button on admin pages
2. **Download Template** (Optional): Click "Template" button to get properly formatted sample
3. **Prepare Your Data**: Fill in the CSV following the template format
4. **Upload CSV File**: Click "Select CSV File" and choose your file
5. **Review Validation**: Check the validation summary and error list
6. **Fix Errors** (if any): Address validation errors and re-upload
7. **Complete Import**: Close dialog when satisfied with validation

## CSV Format Specifications

### Users CSV Format
```csv
firstName,lastName,email,phone,role,businessType,language
John,Doe,john@example.com,+91-9876543210,user,individual,en
```

**Required Fields:**
- `firstName`: User's first name
- `lastName`: User's last name
- `email`: Valid email address
- `phone`: Contact phone number

**Optional Fields:**
- `role`: Either "user" or "admin" (default: "user")
- `businessType`: One of: individual, startup, company, partnership, other
- `language`: Language code (default: "en")

### Clients CSV Format
```csv
clientName,clientType,email,phone,panNumber,gstin,address,city,state,pincode,status,kycStatus
Example Client,individual,client@example.com,+91-9876543210,ABCDE1234F,29ABCDE1234F1Z5,123 Main Street,Mumbai,Maharashtra,400001,active,pending
```

**Required Fields:**
- `clientName`: Full name of the client
- `clientType`: One of: individual, company, partnership
- `email`: Valid email address

**Optional Fields:**
- `phone`: Contact number
- `panNumber`: PAN card number
- `gstin`: GST identification number
- `address`, `city`, `state`, `pincode`: Address details
- `status`: One of: active, inactive, suspended (default: "active")
- `kycStatus`: One of: pending, verified, rejected (default: "pending")

### Applications CSV Format
```csv
userId,serviceId,serviceName,status,notes
user_123,1,GST Registration,submitted,Pending documents
```

**Required Fields:**
- `userId`: ID of the user submitting the application
- `serviceId`: Numeric service ID
- `serviceName`: Name of the service

**Optional Fields:**
- `status`: One of: draft, submitted, under_review, approved, rejected, completed
- `notes`: Additional notes or comments

## API Endpoints

### Export Endpoints
All export endpoints require admin authentication.

```
GET /api/admin/csv/users/export
GET /api/admin/csv/clients/export
GET /api/admin/csv/applications/export
GET /api/admin/csv/payments/export
GET /api/admin/csv/gst/sales/export/:clientId
GET /api/admin/csv/gst/purchases/export/:clientId
```

**Response:** CSV file download

### Import Endpoints
All import endpoints require admin authentication and use multipart/form-data.

```
POST /api/admin/csv/users/import
POST /api/admin/csv/clients/import
POST /api/admin/csv/applications/import
```

**Request Body:** `FormData` with `file` field containing CSV file

**Response:**
```json
{
  "success": true,
  "message": "Import validated: X valid, Y invalid",
  "summary": {
    "total": 10,
    "successful": 8,
    "failed": 2
  },
  "errors": [
    {
      "row": 3,
      "message": "email is required"
    }
  ]
}
```

### Template Endpoints
```
GET /api/admin/csv/template/users
GET /api/admin/csv/template/clients
GET /api/admin/csv/template/applications
```

**Response:** CSV template file with sample data

## Validation Rules

### Email Validation
- Must match format: `xxx@xxx.xxx`
- Example: `user@example.com`

### Status Validation
Different entities have different valid statuses:
- **Users**: active, inactive, suspended
- **Clients**: active, inactive, suspended
- **Applications**: draft, submitted, under_review, approved, rejected, completed

### Business Type Validation
Valid values: individual, startup, company, partnership, other

### Role Validation
Valid values: user, admin

## Error Handling

### Import Validation Errors
When importing, you may encounter these common errors:

1. **Missing Required Fields**
   - Error: "firstName is required"
   - Solution: Ensure all required columns have values

2. **Invalid Email Format**
   - Error: "Invalid email format"
   - Solution: Use valid email format (xxx@xxx.xxx)

3. **Invalid Enum Values**
   - Error: "role must be 'user' or 'admin'"
   - Solution: Use only allowed values from documentation

4. **File Format Issues**
   - Error: "Failed to parse CSV file"
   - Solution: Ensure file is valid CSV with UTF-8 encoding

### Export Errors
1. **Authentication Required**
   - Ensure you're logged in as admin
   - Check if auth token is valid

2. **No Data to Export**
   - Returns empty CSV with headers only

## Security Considerations

### Access Control
- All CSV endpoints require admin role
- Authentication token required in all requests
- Regular users cannot access CSV features

### Data Protection
- Sensitive data (passwords) excluded from exports
- File upload size limited to 10MB
- Only CSV files accepted for import

### Import Safety
- Validation performed before database insertion
- User imports don't auto-insert (require password setup)
- Detailed validation prevents malformed data

## Technical Implementation

### Backend Architecture
```
server/
├── services/
│   └── csvService.ts          # Core CSV utilities
└── routes/
    └── adminCSV.ts            # API endpoints
```

### Frontend Components
```
client/
└── components/
    ├── CSVExportButton.tsx    # Reusable export button
    └── CSVImportButton.tsx    # Reusable import modal
```

### Dependencies
- **csv-parse**: v6.1.0 - CSV parsing for imports
- **json2csv**: v5.0.7 - CSV generation for exports (already existed)

## Best Practices

### Preparing Import Data
1. Download and review the template
2. Keep the same column headers
3. Use UTF-8 encoding when saving CSV
4. Test with a small batch first
5. Review validation errors carefully

### Large Imports
- For files over 1000 rows, consider splitting into smaller batches
- Review validation errors after each batch
- Current limit: 10MB file size

### Data Backup
- Export data regularly for backup
- Store exports securely
- Include timestamp in export filenames

## Troubleshooting

### Import Not Working
1. Check file format (must be .csv)
2. Verify column headers match template
3. Ensure file encoding is UTF-8
4. Check file size (max 10MB)
5. Review validation error messages

### Export Downloads Empty File
1. Verify you have admin permissions
2. Check if data exists in database
3. Try refreshing the page
4. Clear browser cache

### Template Download Issues
1. Check admin authentication
2. Verify entity type is valid
3. Try a different browser

## Future Enhancements
Potential improvements for future releases:
- Bulk update via CSV
- Scheduled exports
- Email export notifications
- Excel format support
- Custom column selection
- Export filters and search integration
- Incremental imports
- Import rollback functionality

## Support
For issues or questions about CSV import/export:
1. Check this documentation
2. Review validation error messages
3. Contact system administrator
4. File a support ticket with:
   - Screenshot of error
   - Sample CSV file (with sensitive data removed)
   - Steps to reproduce issue
