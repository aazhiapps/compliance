# Admin Dashboard Navigation & User Flows

## Overview
This document outlines all navigation paths and user flows in the ComplianCe admin dashboard.

---

## Table of Contents
1. [Main Navigation Structure](#main-navigation-structure)
2. [User Management Flows](#user-management-flows)
3. [Client Management Flows](#client-management-flows)
4. [Application Management Flows](#application-management-flows)
5. [Document Management Flows](#document-management-flows)
6. [Payment Management Flows](#payment-management-flows)
7. [GST Filing Flows](#gst-filing-flows)
8. [Report Generation Flows](#report-generation-flows)

---

## Main Navigation Structure

### Primary Menu (Sidebar)

```
┌────────────────────────────┐
│      ADMIN SIDEBAR         │
├────────────────────────────┤
│ 📊 Dashboard (/admin)      │
│ 👥 Users                   │
│ 🏢 Clients                 │
│ 📝 Applications            │
│ 📄 Documents               │
│ 💰 Payments                │
│ 🧾 GST                     │
│ 📊 Reports                 │
│ 🛍️  Services               │
│ ✅ Compliance              │
│ ⚙️  Settings               │
└────────────────────────────┘
```

### Header Actions
- User profile dropdown
- Notifications bell
- Logout button
- Theme toggle (future)

---

## User Management Flows

### Flow 1: View All Users

```
Start: Admin Dashboard
  ↓
Click "Users" in sidebar or "Manage Users" quick action
  ↓
Navigate to /admin/users
  ↓
View user list with metrics:
  - Total Users
  - Active Users
  - Pending Approvals
  - Suspended Users
  ↓
See table with all users:
  - Name, Email, Role, Type, Status, Join Date
```

### Flow 2: Edit User

```
Start: /admin/users
  ↓
Click "Edit" icon on user row
  ↓
Edit User Modal opens
  ↓
Modify fields:
  - Name
  - Email
  - Phone
  - Role (User, Staff, Admin)
  - Business Type
  - Language
  ↓
Click "Save Changes"
  ↓
Toast confirmation
  ↓
Modal closes, list refreshes
```

### Flow 3: Bulk User Operations

```
Start: /admin/users
  ↓
Select multiple users (checkboxes)
  ↓
Choose bulk action:
  - Approve Selected
  - Suspend Selected
  ↓
Confirmation dialog appears
  ↓
Confirm action
  ↓
Toast confirmation
  ↓
List refreshes with updated statuses
```

### Flow 4: Search/Filter Users

```
Start: /admin/users
  ↓
Enter search query in search box
  OR
Select status filter (All, Active, Inactive, Pending, Suspended)
  ↓
Table filters in real-time
  ↓
View filtered results
```

---

## Client Management Flows

### Flow 1: View All Clients

```
Start: Admin Dashboard
  ↓
Click "Clients" in sidebar
  ↓
Navigate to /admin/clients
  ↓
View client metrics:
  - Total Clients
  - Active Clients
  - KYC Pending
  - High Risk
  ↓
See table with all clients:
  - Business Name, Contact, GSTIN, Status, Risk, Join Date
```

### Flow 2: View Client Detail

```
Start: /admin/clients
  ↓
Click client row or "View" button
  ↓
Navigate to /admin/clients/:id
  ↓
View comprehensive client information:
  - Contact Information
  - Business Details (GSTIN, PAN)
  - KYC Documents & Status
  - Risk Assessment
  - Associated Applications
  - Compliance History
```

### Flow 3: Update Client KYC Status

```
Start: /admin/clients/:id
  ↓
Scroll to KYC section
  ↓
Click "Update KYC Status"
  ↓
Select new status:
  - Verified
  - Pending
  - Rejected
  ↓
Add notes (if applicable)
  ↓
Click "Save"
  ↓
Toast confirmation
  ↓
Page refreshes with updated status
```

### Flow 4: Client to GST Filing

```
Start: /admin/clients/:id
  ↓
Note client GSTIN
  ↓
Click "GST Filing" button or navigate to /admin/gst
  ↓
Select client from dropdown
  ↓
View/manage GST filings
```

---

## Application Management Flows

### Flow 1: View All Applications

```
Start: Admin Dashboard
  ↓
Click "Applications" in sidebar or "View All" on recent applications
  ↓
Navigate to /admin/applications
  ↓
View application metrics:
  - Total Applications
  - Pending Review
  - Approved
  - Rejected
  ↓
See table with all applications:
  - ID, User, Service, Status, Amount, Date, Executive
```

### Flow 2: Review Application (Simple Approve/Reject)

```
Start: /admin/applications
  ↓
Click "Approve" or "Reject" button on application row
  ↓
Confirmation dialog appears
  ↓
Confirm action
  ↓
API call updates status
  ↓
Toast confirmation
  ↓
Table refreshes with updated status
```

### Flow 3: Review Application (Detailed)

```
Start: /admin/applications
  ↓
Click application row or "View" button
  ↓
Navigate to /admin/applications/:id
  ↓
View full application details:
  - User Information
  - Client Information (if linked)
  - Application Details
  - Service Information
  - Payment Status
  ↓
Review information
  ↓
Take action:
  - Update Status
  - Assign Executive
  - Record Payment
  - Add Notes
```

### Flow 4: Update Application Status

```
Start: /admin/applications/:id
  ↓
Scroll to "Status Update" section
  ↓
Select new status from dropdown:
  - Submitted
  - Under Review
  - Approved
  - Rejected
  - Cancelled
  ↓
Click "Update Status"
  ↓
Confirmation dialog
  ↓
Confirm
  ↓
API call with status transition validation
  ↓
Toast confirmation
  ↓
Page refreshes
```

### Flow 5: Assign Executive to Application

```
Start: /admin/applications/:id
  ↓
Scroll to "Executive Assignment" section
  ↓
Click "Assign Executive"
  ↓
Select staff member from dropdown
  ↓
Click "Assign"
  ↓
API call updates assignment
  ↓
Toast confirmation
  ↓
Executive name displayed on application
```

### Flow 6: Bulk Application Operations

```
Start: /admin/applications
  ↓
Select multiple applications (checkboxes)
  ↓
Choose bulk action:
  - Bulk Approve
  - Bulk Reject
  ↓
Confirmation dialog with list of selected apps
  ↓
Confirm action
  ↓
API calls for each application
  ↓
Toast confirmation with results
  ↓
Table refreshes
```

### Flow 7: Filter Applications

```
Start: /admin/applications
  ↓
Apply filters:
  - Status (dropdown)
  - Service Type (dropdown)
  - Date Range (date pickers)
  OR
Enter search query
  ↓
Table updates with filtered results
  ↓
View filtered applications
```

---

## Document Management Flows

### Flow 1: View Document Hierarchy

```
Start: Admin Dashboard
  ↓
Click "Documents" in sidebar or "View Documents" quick action
  ↓
Navigate to /admin/documents
  ↓
View hierarchical structure:
  Level 1: Users (collapsed by default)
    ↓
    Level 2: Services per user
      ↓
      Level 3: Time periods (Year/Month)
        ↓
        Level 4: Individual documents
```

### Flow 2: Navigate Document Tree

```
Start: /admin/documents
  ↓
Click chevron icon to expand user
  ↓
User's services are revealed
  ↓
Click chevron on service to expand
  ↓
Time period folders are revealed
  ↓
Click time period to expand
  ↓
Documents are displayed as cards
```

### Flow 3: Review Document

```
Start: /admin/documents (with tree expanded)
  ↓
Locate document in hierarchy
  ↓
Document card shows:
  - Document name
  - File type and size
  - Upload date
  - Status badge
  ↓
Click "View" to see document
  OR
Click "Download" to save locally
```

### Flow 4: Approve/Reject Document

```
Start: /admin/documents (viewing document card)
  ↓
Click "Approve" or "Reject" button
  ↓
If rejecting, enter reason in dialog
  ↓
Confirm action
  ↓
API call updates document status
  ↓
Toast confirmation
  ↓
Status badge updates in tree
```

### Flow 5: Filter Documents by Status

```
Start: /admin/documents
  ↓
Select status filter at top:
  - All
  - Approved
  - Verifying
  - Uploaded
  - Rejected
  ↓
Tree view filters to show only matching documents
  ↓
Expand sections to view filtered documents
```

---

## Payment Management Flows

### Flow 1: View Payment Dashboard

```
Start: Admin Dashboard
  ↓
Click "Payments" in sidebar
  ↓
Navigate to /admin/payments
  ↓
View payment metrics:
  - Total Revenue
  - Pending Payments
  - This Month Revenue
  ↓
See payment history table:
  - Application ID, User, Service, Amount, Method, Status, Date
```

### Flow 2: Record Manual Payment

```
Start: /admin/payments
  ↓
Scroll to "Record Payment" section
  ↓
Select application from dropdown
  ↓
Amount auto-populates (can be edited)
  ↓
Enter payment details:
  - Payment Method (Online, Cash, Bank Transfer, Cheque)
  - Transaction ID
  - Payment Date
  - Notes (optional)
  ↓
Click "Record Payment"
  ↓
API call creates payment record
  ↓
Toast confirmation
  ↓
Payment appears in history table
```

### Flow 3: View Payment Details

```
Start: /admin/payments
  ↓
Click payment row in history table
  ↓
Payment details modal opens showing:
  - Full transaction information
  - User and application details
  - Payment method and status
  - Transaction ID
  - Timestamp
  ↓
Option to print receipt
  ↓
Close modal
```

### Flow 4: Search/Filter Payments

```
Start: /admin/payments
  ↓
Apply filters:
  - Payment Method (dropdown)
  - Date Range (date pickers)
  OR
Search by Transaction ID
  ↓
Table updates with filtered results
  ↓
View filtered payments
```

---

## GST Filing Flows

### Flow 1: Access GST Dashboard

```
Start: Admin Dashboard
  ↓
Click "GST" in sidebar
  ↓
Navigate to /admin/gst
  ↓
View GST filing interface
```

### Flow 2: Select Client and Month

```
Start: /admin/gst
  ↓
Click "Select Client" dropdown at top
  ↓
Choose client from list (shows business name + GSTIN)
  ↓
Click month selector
  ↓
Choose month to view
  ↓
Dashboard loads data for selected client/month
```

### Flow 3: View Monthly Summary

```
Start: /admin/gst (with client and month selected)
  ↓
View Monthly Summary section showing:
  - Total Sales (Taxable, CGST, SGST, IGST, Total)
  - Total Purchases (Taxable, CGST, SGST, IGST, Total)
  - Tax Liability
  - Input Tax Credit (ITC)
  - Net Tax Payable (calculated)
  ↓
Summary updates automatically when invoices are added/edited
```

### Flow 4: Manage Purchase Invoices

```
Start: /admin/gst (Monthly Summary view)
  ↓
Scroll to "Purchase Invoices" section
  ↓
View table of purchase invoices
  ↓
To Add Invoice:
  - Click "Add Purchase Invoice"
  - Fill modal form:
    * Invoice Number
    * Date
    * Vendor Name
    * Taxable Amount
    * CGST, SGST, IGST
  - Click "Save"
  - Invoice appears in table
  ↓
To Edit Invoice:
  - Click edit icon on row
  - Modify fields in modal
  - Save changes
  ↓
To Delete Invoice:
  - Click delete icon
  - Confirm deletion
  - Invoice removed from table
```

### Flow 5: Manage Sales Invoices

```
Start: /admin/gst (Monthly Summary view)
  ↓
Scroll to "Sales Invoices" section
  ↓
View table of sales invoices
  ↓
[Same add/edit/delete flow as purchase invoices]
```

### Flow 6: Mark GST Return as Filed

```
Start: /admin/gst (Monthly Summary view)
  ↓
Scroll to "Filing Status" section
  ↓
View return types:
  - GSTR-1 (Outward Supplies)
  - GSTR-3B (Monthly Return)
  ↓
Each shows:
  - Status (Not Filed, Filed, Overdue)
  - Due Date
  ↓
Click "File Return" button
  ↓
Confirmation dialog
  ↓
Confirm filing
  ↓
Status updates to "Filed"
  ↓
Filing date recorded
```

---

## Report Generation Flows

### Flow 1: Access Reports Dashboard

```
Start: Admin Dashboard
  ↓
Click "Reports" in sidebar
  ↓
Navigate to /admin/reports
  ↓
View report filtering interface
```

### Flow 2: Filter Reports

```
Start: /admin/reports
  ↓
Apply filters:
  - Client (multi-select dropdown)
  - Financial Year (dropdown)
  - Report Type (All, GST, Income Tax, Compliance, Audit)
  - Status (All, Generated, Pending, Approved)
  - Date Range (date pickers)
  ↓
Click "Apply Filters"
  ↓
Reports table updates with filtered results
```

### Flow 3: Export Report as CSV

```
Start: /admin/reports (filtered list)
  ↓
Click "Export CSV" button on report row
  ↓
API call generates CSV
  ↓
File downloads automatically
  ↓
Export logged in audit log
  ↓
Toast confirmation
```

### Flow 4: Export Report as PDF

```
Start: /admin/reports (filtered list)
  ↓
Click "Export PDF" button on report row
  ↓
API call generates PDF with formatting
  ↓
File downloads automatically
  ↓
Export logged in audit log
  ↓
Toast confirmation
```

### Flow 5: View Export Audit Logs

```
Start: /admin/reports
  ↓
Scroll to "Export Audit Logs" section
  ↓
View table showing:
  - Report ID
  - Exported By (user)
  - Export Type (CSV/PDF)
  - Timestamp
  ↓
Filter logs by date or user
  ↓
View export history
```

---

## Service Management Flows

### Flow 1: View Service Catalog

```
Start: Admin Dashboard
  ↓
Click "Services" in sidebar or management card
  ↓
Navigate to /admin/services
  ↓
View all services in grid or table layout
  ↓
Each service shows:
  - Name, Type, Icon
  - Price
  - Processing Time
  - Status (Active/Inactive)
```

### Flow 2: Add New Service

```
Start: /admin/services
  ↓
Click "Add Service" button
  ↓
Add Service Modal opens
  ↓
Fill form fields:
  - Service Name
  - Service Type
  - Icon (emoji picker)
  - Description
  - Price (INR)
  - Processing Time
  - Required Documents (multi-line)
  - Terms and Conditions
  - Status (Active/Inactive)
  ↓
Click "Create Service"
  ↓
API call creates service
  ↓
Toast confirmation
  ↓
Modal closes
  ↓
Service appears in catalog
```

### Flow 3: Edit Service

```
Start: /admin/services
  ↓
Click "Edit" icon on service card
  ↓
Edit Service Modal opens with pre-filled data
  ↓
Modify fields
  ↓
Click "Save Changes"
  ↓
API call updates service
  ↓
Toast confirmation
  ↓
Modal closes
  ↓
Service updates in catalog
```

### Flow 4: Delete Service

```
Start: /admin/services
  ↓
Click "Delete" icon on service card
  ↓
Confirmation dialog appears:
  "Are you sure? This cannot be undone."
  ↓
Confirm deletion
  ↓
API call deletes service
  ↓
Toast confirmation
  ↓
Service removed from catalog
```

### Flow 5: Toggle Service Active Status

```
Start: /admin/services
  ↓
Click toggle switch on service card
  ↓
Status immediately changes (Active ↔ Inactive)
  ↓
API call updates status
  ↓
Toast confirmation
  ↓
Service badge updates
```

---

## Compliance Monitoring Flows

### Flow 1: View Compliance Dashboard

```
Start: Admin Dashboard
  ↓
Click "Compliance" in sidebar or management card
  ↓
Navigate to /admin/compliance
  ↓
View compliance metrics:
  - Compliant Clients
  - Pending Requirements
  - At Risk
  - Non-Compliant
  ↓
See requirements table and customer breakdown
```

### Flow 2: Filter Compliance Status

```
Start: /admin/compliance
  ↓
Select status filter:
  - All
  - Compliant (green)
  - Pending (blue)
  - At Risk (yellow)
  - Non-Compliant (red)
  ↓
Table filters to show matching clients
  ↓
View filtered compliance data
```

### Flow 3: View Client Compliance Details

```
Start: /admin/compliance
  ↓
Click client row in table
  ↓
View detailed compliance breakdown:
  - Compliance Score
  - Requirements Met / Total
  - Upcoming Deadlines
  - Overdue Items
  - Compliance History
```

---

## Settings Management Flows

### Flow 1: Access Settings

```
Start: Admin Dashboard
  ↓
Click "Settings" in sidebar
  ↓
Navigate to /admin/settings
  ↓
View tabbed interface:
  - General
  - Notifications
  - Security
  - Payments
  - Backup
```

### Flow 2: Update General Settings

```
Start: /admin/settings
  ↓
Click "General" tab (default)
  ↓
Modify settings:
  - Company Name
  - Email Settings
  - Timezone
  - Currency
  ↓
Click "Save Changes"
  ↓
Settings saved to localStorage (or DB)
  ↓
Toast confirmation
```

### Flow 3: Configure Notifications

```
Start: /admin/settings
  ↓
Click "Notifications" tab
  ↓
Toggle notification preferences:
  - Email Notifications (ON/OFF)
  - SMS Notifications (ON/OFF)
  - Push Notifications (ON/OFF)
  ↓
Select notification types to receive
  ↓
Click "Save"
  ↓
Toast confirmation
```

---

## Common Interaction Patterns

### Pattern 1: Search
```
1. Locate search box at top of page
2. Enter search query
3. Table filters in real-time as you type
4. Clear search to reset
```

### Pattern 2: Pagination
```
1. View current page number at bottom of table
2. Click "Next" or "Previous" to navigate
3. Or click specific page number
4. Table updates with new page data
```

### Pattern 3: Sort
```
1. Click column header in table
2. Column sorts ascending (↑)
3. Click again to sort descending (↓)
4. Click third time to remove sort
```

### Pattern 4: Bulk Selection
```
1. Click checkbox in table header (select all on page)
2. Or click individual row checkboxes
3. Bulk action buttons appear at top
4. Select action and confirm
```

### Pattern 5: Modal Dialog
```
1. Trigger action that opens modal
2. Modal overlays page with form/content
3. Fill form or view information
4. Click "Save" or "Cancel"
5. Modal closes and page updates (if save)
```

### Pattern 6: Toast Notification
```
1. Perform action (save, delete, etc.)
2. Toast appears in top-right corner
3. Shows success (green) or error (red) message
4. Auto-dismisses after 3 seconds
5. Or click X to dismiss manually
```

---

## Quick Reference: All Routes

```
/admin                          - Dashboard (Overview)
/admin/users                    - User Management
/admin/clients                  - Client List
/admin/clients/:id              - Client Detail
/admin/applications             - Application List
/admin/applications/:id         - Application Detail
/admin/documents                - Document Tree
/admin/gst                      - GST Filing
/admin/payments                 - Payment Management
/admin/reports                  - Report Generation
/admin/services                 - Service Catalog
/admin/compliance               - Compliance Monitor
/admin/settings                 - System Settings
```

---

## Navigation Best Practices

### For Admins:
1. **Start at Dashboard** - Get overview before diving into specifics
2. **Use Sidebar** - Primary navigation for all main sections
3. **Use Breadcrumbs** - Track your location and navigate back
4. **Use Search** - Find specific items quickly
5. **Use Filters** - Narrow down large datasets
6. **Use Quick Actions** - Common tasks accessible from multiple places

### For Efficiency:
1. **Keyboard Shortcuts** (future feature)
2. **Bookmarks** - Bookmark frequently accessed pages
3. **Browser Back** - Navigate back through history
4. **Multiple Tabs** - Open detail pages in new tabs

---

**Document Version:** 1.0  
**Last Updated:** February 19, 2026  
**Status:** Complete
