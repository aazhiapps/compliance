# Admin Dashboard Quick Reference Guide

## 📋 Table of Contents
1. [Admin Pages Overview](#admin-pages-overview)
2. [Navigation Quick Reference](#navigation-quick-reference)
3. [Common Actions](#common-actions)
4. [Status Indicators](#status-indicators)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Troubleshooting](#troubleshooting)

---

## Admin Pages Overview

### Dashboard (/admin)
**Purpose:** Central hub with overview metrics and quick actions

**Key Metrics:**
- 👥 Total Users
- 📝 Active Applications
- ⏳ Pending Review
- ✅ Approved Applications

**Quick Actions:**
- Manage Users → `/admin/users`
- Review Applications → `/admin/applications`
- Review Documents → `/admin/documents`
- Compliance Status → `/admin/compliance`

**Charts:**
- Applications Over Time (Line Chart)
- Monthly submissions and approvals

---

### Users (/admin/users)
**Purpose:** Manage user accounts and permissions

**Actions:**
- ✏️ Edit user details
- ✅ Approve pending users
- 🚫 Suspend/Activate users
- 📋 Bulk operations
- 🔍 Search users

**Filters:**
- All, Active, Inactive, Pending, Suspended

---

### Clients (/admin/clients)
**Purpose:** Manage client profiles and KYC

**View:**
- 🏢 Business details
- 📋 KYC status
- ⚠️ Risk level
- 📅 Join date

**Actions:**
- 👁️ View details → `/admin/clients/:id`
- 🔍 Search clients
- Filter by KYC status and risk

---

### Applications (/admin/applications)
**Purpose:** Review and manage service applications

**Bulk Actions:**
- ✅ Bulk Approve
- ❌ Bulk Reject

**Individual Actions:**
- 👁️ View details → `/admin/applications/:id`
- ✅ Quick approve
- ❌ Quick reject

**Filters:**
- Status (All, Submitted, Under Review, Approved, Rejected)
- Service Type
- Date Range

---

### Documents (/admin/documents)
**Purpose:** Hierarchical document management

**Structure:**
```
📁 User Name
  └── 📁 Service Name
       └── 📁 2024
            └── 📁 January
                 └── 📄 Document.pdf
```

**Actions:**
- 👁️ View/Download document
- ✅ Approve
- ❌ Reject
- 📝 Request revision

**Filters:**
- All, Approved, Verifying, Uploaded, Rejected

---

### GST (/admin/gst)
**Purpose:** GST filing and invoice management

**Workflow:**
1. Select Client (dropdown)
2. Select Month
3. View Monthly Summary
4. Manage Purchase Invoices
5. Manage Sales Invoices
6. Check Filing Status
7. Mark Returns as Filed

**Summary Calculations:**
- Total Sales (Taxable + CGST + SGST + IGST)
- Total Purchases
- Tax Liability
- Input Tax Credit (ITC)
- Net Tax Payable

---

### Payments (/admin/payments)
**Purpose:** Track and record payments

**Record Payment:**
1. Select Application
2. Enter Amount
3. Choose Payment Method:
   - 💳 Online
   - 💵 Cash
   - 🏦 Bank Transfer
   - 📝 Cheque
4. Add Transaction ID
5. Select Date
6. Add Notes

**View:**
- Payment history table
- Revenue metrics

---

### Reports (/admin/reports)
**Purpose:** Generate and export reports

**Filters:**
- 🏢 Client (multi-select)
- 📅 Financial Year
- 📊 Report Type (GST, Income Tax, Compliance, Audit)
- 📍 Status (Generated, Pending, Approved)
- 📆 Date Range

**Export:**
- 📄 CSV Export
- 📑 PDF Export
- 📝 Export Audit Logs

---

### Services (/admin/services)
**Purpose:** Manage service catalog

**Service Details:**
- Name, Type, Icon
- 💰 Price
- ⏱️ Processing Time
- 📋 Required Documents
- 🔄 Active/Inactive Status

**Actions:**
- ➕ Add Service
- ✏️ Edit Service
- 🗑️ Delete Service
- 🔄 Toggle Active Status

---

### Compliance (/admin/compliance)
**Purpose:** Monitor compliance requirements

**Metrics:**
- ✅ Compliant Clients
- ⏳ Pending Requirements
- ⚠️ At Risk
- ❌ Non-Compliant

**View:**
- Requirements table
- Customer compliance breakdown
- Upcoming deadlines
- Overdue items

---

### Settings (/admin/settings)
**Purpose:** System configuration

**Tabs:**
- ⚙️ General Settings
- 🔔 Notifications
- 🔒 Security
- 💳 Payment Gateway
- 💾 Backup

---

## Navigation Quick Reference

### Sidebar Menu

```
📊 Dashboard          /admin
👥 Users              /admin/users
🏢 Clients            /admin/clients
📝 Applications       /admin/applications
📄 Documents          /admin/documents
💰 Payments           /admin/payments
🧾 GST                /admin/gst
📊 Reports            /admin/reports
🛍️ Services           /admin/services
✅ Compliance         /admin/compliance
⚙️ Settings           /admin/settings
```

### Detail Pages

```
Application Detail:   /admin/applications/:id
Client Detail:        /admin/clients/:id
```

### How to Navigate

**From Dashboard:**
1. Use sidebar menu for main sections
2. Click metric cards to access related pages
3. Use quick action buttons
4. Click "View All" on recent items

**From List Pages:**
1. Click row to view details
2. Use action buttons (Edit, View, Delete)
3. Use search box to find items
4. Apply filters to narrow results

**Within Forms:**
1. Fill required fields (marked with *)
2. Click "Save" to submit
3. Click "Cancel" to discard changes
4. Watch for validation errors

---

## Common Actions

### ✅ Approve Application
```
Method 1: Quick Approve
  Applications List → Click "Approve" button → Confirm

Method 2: Detailed Review
  Applications List → Click row → Review details
  → Update Status to "Approved" → Click "Update Status"
```

### ❌ Reject Application
```
Applications List → Click "Reject" button
→ Enter rejection reason → Confirm
```

### 👥 Edit User
```
Users List → Click "Edit" icon
→ Modify fields in modal → Click "Save Changes"
```

### 💰 Record Payment
```
Payments Page → Scroll to "Record Payment"
→ Select Application → Enter details → Click "Record Payment"
```

### 📊 Export Report
```
Reports Page → Apply filters → Click "Export CSV" or "Export PDF"
→ File downloads automatically
```

### 📄 Approve Document
```
Documents Page → Expand tree to document
→ Click "Approve" button → Confirm
```

### 🧾 File GST Return
```
GST Page → Select Client → Select Month
→ Scroll to Filing Status → Click "File Return" → Confirm
```

---

## Status Indicators

### Application Status

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Submitted | 🔵 Blue | 📝 | Just submitted |
| Under Review | 🟡 Yellow | 🔍 | Being reviewed |
| Approved | 🟢 Green | ✅ | Approved |
| Rejected | 🔴 Red | ❌ | Rejected |
| Cancelled | ⚫ Gray | 🚫 | Cancelled |

### User Status

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Active | 🟢 Green | ✅ | Active account |
| Inactive | ⚫ Gray | ⏸️ | Inactive |
| Pending | 🟡 Yellow | ⏳ | Awaiting approval |
| Suspended | 🔴 Red | 🚫 | Suspended |

### KYC Status

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Verified | 🟢 Green | ✅ | KYC verified |
| Pending | 🟡 Yellow | ⏳ | KYC pending |
| Rejected | 🔴 Red | ❌ | KYC rejected |

### Risk Level

| Level | Color | Icon | Meaning |
|-------|-------|------|---------|
| Low | 🟢 Green | ✅ | Low risk |
| Medium | 🟡 Yellow | ⚠️ | Medium risk |
| High | 🔴 Red | 🔥 | High risk |

### Document Status

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Approved | 🟢 Green | ✅ | Approved |
| Verifying | 🟡 Yellow | 🔍 | Being verified |
| Uploaded | 🔵 Blue | 📤 | Just uploaded |
| Rejected | 🔴 Red | ❌ | Rejected |

### Payment Status

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Success | 🟢 Green | ✅ | Payment successful |
| Pending | 🟡 Yellow | ⏳ | Payment pending |
| Failed | 🔴 Red | ❌ | Payment failed |

### GST Filing Status

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Filed | 🟢 Green | ✅ | Return filed |
| Pending | 🟡 Yellow | ⏳ | Filing pending |
| Overdue | 🔴 Red | ⚠️ | Filing overdue |

---

## Keyboard Shortcuts

*Note: Keyboard shortcuts are planned for future implementation*

**Planned Shortcuts:**

| Shortcut | Action |
|----------|--------|
| `Alt + D` | Go to Dashboard |
| `Alt + U` | Go to Users |
| `Alt + A` | Go to Applications |
| `Alt + C` | Go to Clients |
| `Alt + S` | Search (focus search box) |
| `Ctrl + S` | Save (in forms) |
| `Esc` | Close modal/dialog |
| `Enter` | Confirm action |
| `?` | Show keyboard shortcuts help |

---

## Troubleshooting

### Issue: Cannot Login
**Possible Causes:**
- Incorrect credentials
- Database connection issue
- JWT secret not configured

**Solutions:**
1. Verify credentials:
   - Admin: `admin@example.com` / `Admin@1234`
2. Check server logs for database errors
3. Ensure `.env` file has valid `JWT_SECRET`

### Issue: Page Loads but Shows No Data
**Possible Causes:**
- API endpoint returns empty data
- Database has no records
- Authorization issue

**Solutions:**
1. Check browser console for errors
2. Verify API endpoint in Network tab
3. Check if user has admin role
4. Verify database has seed data

### Issue: Cannot Update Application Status
**Possible Causes:**
- Invalid status transition
- Missing permissions
- API error

**Solutions:**
1. Check allowed status transitions
2. Verify user has admin role
3. Check server logs for validation errors

### Issue: Document Not Loading
**Possible Causes:**
- File storage issue
- Missing document in database
- Incorrect file path

**Solutions:**
1. Check if document exists in storage
2. Verify document record in database
3. Check server logs for file access errors

### Issue: Export Fails
**Possible Causes:**
- Report generation error
- Missing data
- Server timeout

**Solutions:**
1. Check if report has data
2. Try smaller date range
3. Check server logs for generation errors
4. Verify export service is running

### Issue: Payment Recording Fails
**Possible Causes:**
- Invalid application ID
- Duplicate payment
- Validation error

**Solutions:**
1. Verify application exists and is valid
2. Check if payment already recorded
3. Review payment details for errors
4. Check server validation logs

---

## Admin Roles & Permissions

### What Admins Can Do:
- ✅ View all users, clients, applications
- ✅ Approve/reject applications
- ✅ Manage user accounts
- ✅ Record payments
- ✅ Generate and export reports
- ✅ Manage GST filings
- ✅ Configure services
- ✅ View compliance status
- ✅ Access system settings

### What Admins Cannot Do:
- ❌ Delete users (only suspend)
- ❌ Modify approved applications (audit trail)
- ❌ Access user passwords
- ❌ Bypass validation rules

---

## Best Practices

### For Efficient Admin Work:

1. **Start with Dashboard**
   - Get overview of pending items
   - Prioritize high-priority tasks

2. **Use Filters Effectively**
   - Filter by status to focus on pending items
   - Use date ranges to view recent activity

3. **Regular Monitoring**
   - Check pending applications daily
   - Review compliance status weekly
   - Monitor payment reconciliation

4. **Documentation**
   - Add notes to applications
   - Document rejection reasons
   - Keep audit trail clear

5. **Bulk Operations**
   - Use bulk approve for similar applications
   - Process multiple documents at once

6. **Communication**
   - Respond to client queries promptly
   - Keep staff assignments updated
   - Maintain clear status updates

---

## Contact & Support

### For Technical Issues:
- Check server logs
- Review browser console
- Check network requests

### For Business Questions:
- Refer to admin manual
- Contact system administrator
- Review compliance guidelines

---

## Quick Tips

💡 **Tip 1:** Use search to quickly find specific users or applications

💡 **Tip 2:** Apply status filters to focus on items needing attention

💡 **Tip 3:** Use bulk operations to save time on repetitive tasks

💡 **Tip 4:** Regularly export reports for record-keeping

💡 **Tip 5:** Review compliance dashboard to identify at-risk clients

💡 **Tip 6:** Keep notes on applications for audit trail

💡 **Tip 7:** Use month selector in GST page to review past filings

💡 **Tip 8:** Record payments immediately after receiving them

💡 **Tip 9:** Approve documents promptly to avoid delays

💡 **Tip 10:** Check system status indicators on dashboard

---

**Version:** 1.0  
**Last Updated:** February 19, 2026  
**For:** ComplianCe Admin Dashboard  
**Audience:** Admin Users
