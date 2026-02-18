# Client Lifecycle & Application Flow Diagrams

## 1. COMPLETE CLIENT LIFECYCLE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER AUTHENTICATION                              │
│                    (Login / Signup via /api/auth)                       │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CLIENT EXISTENCE CHECK                              │
│                   GET /api/clients/check                                 │
│                                                                          │
│   Query: Does active client exist for this userId?                      │
└────────────┬─────────────────────────────────┬──────────────────────────┘
             │                                 │
      ┌──────▼─────┐                    ┌──────▼──────┐
      │    YES     │                    │     NO      │
      │ (Existing) │                    │(First Time) │
      └─────┬──────┘                    └──────┬──────┘
            │                                  │
            │                                  ▼
            │                    ┌─────────────────────────────┐
            │                    │  CLIENT ONBOARDING FLOW     │
            │                    │                             │
            │                    │  1. Collect KYC Info        │
            │                    │     - Name, Type, PAN       │
            │                    │     - Address, Contact      │
            │                    │                             │
            │                    │  2. Upload Documents        │
            │                    │     - PAN Card              │
            │                    │     - Aadhaar               │
            │                    │     - Address Proof         │
            │                    │                             │
            │                    │  3. Create Client           │
            │                    │     POST /api/clients       │
            │                    │     Status: active          │
            │                    │     KYC: pending            │
            │                    └──────────┬──────────────────┘
            │                               │
            └───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVICE SELECTION                                 │
│                    User browses /api/admin/services                     │
│                    Selects service (e.g., GST Registration)             │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    APPLICATION CREATION                                  │
│                  POST /api/applications                                  │
│                                                                          │
│   Payload:                                                               │
│   {                                                                      │
│     serviceId: number                                                    │
│     serviceName: string                                                  │
│     clientId: string  ← Links to Client                                 │
│   }                                                                      │
│                                                                          │
│   → Application created with status: "draft"                            │
│   → Audit log: application created                                      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DOCUMENT MANAGEMENT                                   │
│                                                                          │
│   For Existing Clients:                                                 │
│   ┌────────────────────────────────────────────┐                        │
│   │ GET /api/clients/:id/documents             │                        │
│   │ → System shows reusable documents          │                        │
│   │   ✓ PAN Card (verified)                    │                        │
│   │   ✓ Aadhaar Card (verified)                │                        │
│   │   ✓ Address Proof (verified)               │                        │
│   │                                             │                        │
│   │ User selects documents to reuse            │                        │
│   │ System links them to new application       │                        │
│   │ Only requests missing documents            │                        │
│   └────────────────────────────────────────────┘                        │
│                                                                          │
│   For New Documents:                                                    │
│   ┌────────────────────────────────────────────┐                        │
│   │ POST /api/applications/:id/documents       │                        │
│   │ → Upload new files                         │                        │
│   │ → Audit log: document uploaded             │                        │
│   └────────────────────────────────────────────┘                        │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION SUBMISSION                              │
│                                                                          │
│   User clicks "Submit Application"                                      │
│   → Status: draft → submitted                                           │
│   → Audit log: status change (draft → submitted)                        │
│   → Notification sent to admin                                          │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       ADMIN REVIEW PROCESS                               │
│                                                                          │
│   Admin views: GET /api/admin/applications                              │
│                                                                          │
│   Review Actions:                                                       │
│   ┌─────────────────────────────────────────┐                           │
│   │ 1. Assign to Staff                      │                           │
│   │    POST /api/staff/assign/:id           │                           │
│   │    → Audit log: staff assigned          │                           │
│   │                                         │                           │
│   │ 2. Update Status                        │                           │
│   │    PATCH /api/admin/applications/:id    │                           │
│   │    ✓ Validate transition (middleware)   │                           │
│   │    ✓ Update status                      │                           │
│   │    ✓ Audit log: status change           │                           │
│   │                                         │                           │
│   │ 3. Request More Info                    │                           │
│   │    → Status: under_review → query_raised│                           │
│   │    → User notified                      │                           │
│   │                                         │                           │
│   │ 4. Approve/Reject                       │                           │
│   │    → Status: under_review → approved    │                           │
│   │    → Audit log: approved by admin       │                           │
│   │    → Trigger post-approval actions      │                           │
│   └─────────────────────────────────────────┘                           │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    POST-APPROVAL ACTIONS                                 │
│                                                                          │
│   IF service = GST Registration:                                        │
│   ┌────────────────────────────────────────┐                            │
│   │ Auto-create GSTClient                  │                            │
│   │ → Check if GSTClient exists            │                            │
│   │ → If not, create with user details     │                            │
│   │ → User can now access GST filing       │                            │
│   └────────────────────────────────────────┘                            │
│                                                                          │
│   Update Application:                                                   │
│   → Status: approved → completed                                        │
│   → Generate completion certificate                                     │
│   → Send confirmation email                                             │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CLIENT DASHBOARD VIEW                               │
│                  GET /api/clients/:id/services                          │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────┐           │
│   │  Client: ABC Pvt Ltd                                    │           │
│   │  PAN: ABCDE1234F        Status: Active                  │           │
│   │  KYC Status: Verified                                   │           │
│   │                                                          │           │
│   │  ┌────────────────────────────────────────────────────┐ │           │
│   │  │ Services Applied (3)                               │ │           │
│   │  │                                                    │ │           │
│   │  │ 1. GST Registration                                │ │           │
│   │  │    Status: Completed ✓                             │ │           │
│   │  │    Applied: 2024-01-15                             │ │           │
│   │  │    Payment: ₹499 (Paid)                            │ │           │
│   │  │                                                    │ │           │
│   │  │ 2. PAN Registration                                │ │           │
│   │  │    Status: Under Review ⏳                         │ │           │
│   │  │    Applied: 2024-02-01                             │ │           │
│   │  │    Payment: ₹299 (Paid)                            │ │           │
│   │  │                                                    │ │           │
│   │  │ 3. Company Registration                            │ │           │
│   │  │    Status: Draft ✏                                │ │           │
│   │  │    Started: 2024-02-10                             │ │           │
│   │  │    Payment: Pending                                │ │           │
│   │  └────────────────────────────────────────────────────┘ │           │
│   │                                                          │           │
│   │  ┌────────────────────────────────────────────────────┐ │           │
│   │  │ Documents (Reusable) (5)                           │ │           │
│   │  │ • PAN Card ✓ (verified)                            │ │           │
│   │  │ • Aadhaar Card ✓ (verified)                        │ │           │
│   │  │ • Address Proof ✓ (verified)                       │ │           │
│   │  │ • GST Certificate ✓ (verified)                     │ │           │
│   │  │ • Bank Statement ⚠ (expires: 2024-06-30)          │ │           │
│   │  └────────────────────────────────────────────────────┘ │           │
│   │                                                          │           │
│   │  ┌────────────────────────────────────────────────────┐ │           │
│   │  │ Payment History                                    │ │           │
│   │  │ Total Paid: ₹798                                   │ │           │
│   │  └────────────────────────────────────────────────────┘ │           │
│   └─────────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. STATUS TRANSITION STATE MACHINE

```
┌──────────┐
│  DRAFT   │  ← Initial state when application created
└─────┬────┘
      │ User clicks "Submit"
      ▼
┌──────────────┐
│  SUBMITTED   │  ← Awaiting admin/staff assignment
└──────┬───────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────────┐  ┌──────────┐
│UNDER_REVIEW │  │ REJECTED │  ← Application denied
└──────┬──────┘  └──────────┘
       │
       ├──────────────┬─────────────┐
       │              │             │
       ▼              ▼             ▼
┌──────────────┐  ┌──────────┐  ┌──────────┐
│ QUERY_RAISED │  │ APPROVED │  │ REJECTED │
└──────┬───────┘  └─────┬────┘  └──────────┘
       │                │
       │ User responds  │ Admin confirms
       ▼                ▼
┌─────────────────┐  ┌───────────┐
│ QUERY_RESPONDED │  │ COMPLETED │  ← Service delivered
└────────┬────────┘  └─────┬─────┘
         │                 │
         │                 │ Ongoing compliance
         ▼                 ▼
┌─────────────┐      ┌─────────────┐
│UNDER_REVIEW │      │ MONITORING  │  ← Long-term tracking
└─────────────┘      └─────────────┘

Valid Transitions (enforced by middleware):
• draft            → submitted
• submitted        → under_review, rejected
• under_review     → query_raised, approved, rejected
• query_raised     → query_responded, rejected
• query_responded  → under_review, approved, rejected
• approved         → completed, monitoring
• completed        → monitoring
• rejected         → (terminal state)
• monitoring       → (terminal state)
```

---

## 3. AUDIT LOGGING FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                  ANY USER ACTION                                 │
│  (Create, Update, Delete, Status Change, Upload, etc.)          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              AUDIT LOG SERVICE                                   │
│          (server/services/AuditLogService.ts)                   │
│                                                                  │
│  Captures:                                                       │
│  • Entity Type (client, application, document, payment)         │
│  • Entity ID                                                     │
│  • Action (create, update, delete, status_change)               │
│  • Changes (old value → new value)                              │
│  • Performed By (userId)                                         │
│  • Timestamp                                                     │
│  • IP Address                                                    │
│  • User Agent                                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            AUDIT LOG REPOSITORY                                  │
│         Saves to MongoDB (AuditLog collection)                  │
│                                                                  │
│  Indexed by:                                                     │
│  • entityType + entityId                                         │
│  • performedBy + timestamp                                       │
│  • timestamp (DESC)                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               AUDIT LOG RETRIEVAL                                │
│                                                                  │
│  Admin Access:                                                   │
│  • GET /api/admin/audit-logs                                     │
│    → Filter by entity, user, date, action                       │
│                                                                  │
│  • GET /api/admin/audit-logs/recent                              │
│    → Last 100 actions                                            │
│                                                                  │
│  • GET /api/admin/audit-logs/:entityType/:entityId               │
│    → Full history for specific entity                            │
│                                                                  │
│  • GET /api/admin/audit-logs/stats                               │
│    → Activity statistics                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. DOCUMENT REUSABILITY FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│         USER APPLIES FOR NEW SERVICE                             │
│      (Already has verified documents from previous service)      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│        SYSTEM: GET /api/clients/:id/documents                    │
│                                                                  │
│  Returns all documents linked to this client:                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Document 1:                                              │   │
│  │   Type: pan_card                                         │   │
│  │   Status: verified                                       │   │
│  │   Expires: N/A                                           │   │
│  │   Used in: [app_001, app_002]                            │   │
│  │   isReusable: true                                       │   │
│  │                                                          │   │
│  │ Document 2:                                              │   │
│  │   Type: aadhaar_card                                     │   │
│  │   Status: verified                                       │   │
│  │   Expires: N/A                                           │   │
│  │   Used in: [app_001]                                     │   │
│  │   isReusable: true                                       │   │
│  │                                                          │   │
│  │ Document 3:                                              │   │
│  │   Type: bank_statement                                   │   │
│  │   Status: verified                                       │   │
│  │   Expires: 2024-06-30                                    │   │
│  │   Used in: [app_001]                                     │   │
│  │   isReusable: true (but expiring soon!)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              USER INTERFACE SHOWS OPTIONS                        │
│                                                                  │
│  Service requires: PAN, Aadhaar, Address Proof                  │
│                                                                  │
│  Available Documents:                                            │
│  ☑ PAN Card (verified) - Reuse?      [Yes] [Upload New]        │
│  ☑ Aadhaar Card (verified) - Reuse?  [Yes] [Upload New]        │
│  ☐ Address Proof - Not found         [Upload Required]          │
│                                                                  │
│  ⚠ Bank Statement expires in 30 days - Consider updating        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            SYSTEM LINKS DOCUMENTS TO APPLICATION                 │
│                                                                  │
│  For reused documents:                                           │
│  → Update document.usedInApplications array                      │
│  → Add reference in application.documents                        │
│  → No need to re-upload or re-verify                            │
│                                                                  │
│  For new documents:                                              │
│  → Upload via POST /api/applications/:id/documents               │
│  → Mark as uploaded (pending verification)                       │
│  → Add to document.usedInApplications                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. ADMIN CLIENT VIEW HIERARCHY

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Clients Overview                                           │ │
│  │ Total: 150 | Active: 140 | Inactive: 10                   │ │
│  │ KYC Pending: 25 | Verified: 125                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Filter By:                                                      │
│  [Client Status ▼] [KYC Status ▼] [Service ▼] [Risk Level ▼]   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Client List                                                │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Name          | PAN       | Services | Status  | KYC      │ │
│  │─────────────────────────────────────────────────────────────│ │
│  │ ABC Pvt Ltd   | ABCDE1234F| 3        | Active  | Verified │ │
│  │ XYZ Corp      | XYZAB5678G| 1        | Active  | Pending  │ │
│  │ John Doe      | JOHND9012H| 2        | Active  | Verified │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────────┘
                             │ Click on client
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              CLIENT DETAIL VIEW (Admin)                          │
│         GET /api/clients/:id/services                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Client Profile                                             │ │
│  │ Name: ABC Pvt Ltd                                          │ │
│  │ PAN: ABCDE1234F       GSTIN: 27ABCDE1234F1Z2              │ │
│  │ Type: Company         Status: Active                       │ │
│  │ KYC Status: Verified  Risk Level: Low                      │ │
│  │                                                            │ │
│  │ Contact: info@abc.com | +91-9876543210                     │ │
│  │ Address: Mumbai, Maharashtra                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Service Applications (3)                                   │ │
│  │┌──────────────────────────────────────────────────────────┐│ │
│  ││ GST Registration                                         ││ │
│  ││ Application ID: app_001                                  ││ │
│  ││ Status: Completed ✓                                      ││ │
│  ││ Applied: 2024-01-15    Completed: 2024-01-20             ││ │
│  ││ Assigned: Staff A      Payment: ₹499 (Paid)             ││ │
│  ││ [View Details] [Audit Trail]                             ││ │
│  │└──────────────────────────────────────────────────────────┘│ │
│  │┌──────────────────────────────────────────────────────────┐│ │
│  ││ PAN Registration                                         ││ │
│  ││ Application ID: app_005                                  ││ │
│  ││ Status: Under Review ⏳                                  ││ │
│  ││ Applied: 2024-02-01    ETA: 2024-02-15                   ││ │
│  ││ Assigned: Staff B      Payment: ₹299 (Paid)             ││ │
│  ││ [View Details] [Update Status] [Audit Trail]             ││ │
│  │└──────────────────────────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Documents (5)                                              │ │
│  │ • PAN Card - Verified ✓        Uploaded: 2024-01-15       │ │
│  │ • Aadhaar Card - Verified ✓    Uploaded: 2024-01-15       │ │
│  │ • Address Proof - Verified ✓   Uploaded: 2024-01-15       │ │
│  │ • GST Cert - Verified ✓        Uploaded: 2024-01-20       │ │
│  │ • Bank Stmt - Expiring Soon ⚠  Expires: 2024-06-30       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Compliance Alerts (1)                                      │ │
│  │ ⚠ Bank Statement expires in 30 days - Request update      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Audit Trail                                                │ │
│  │ GET /api/admin/audit-logs/client/:clientId                 │ │
│  │                                                            │ │
│  │ 2024-02-10 15:30 | Status Change | app_005               │ │
│  │                  | submitted → under_review               │ │
│  │                  | By: Admin User                          │ │
│  │                                                            │ │
│  │ 2024-02-01 10:00 | Application Created | app_005          │ │
│  │                  | Service: PAN Registration              │ │
│  │                  | By: user_123                            │ │
│  │                                                            │ │
│  │ 2024-01-20 16:00 | KYC Verified                           │ │
│  │                  | All documents approved                  │ │
│  │                  | By: Staff B                             │ │
│  │                                                            │ │
│  │ [Load More...]                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. DATA ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB Collections                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────┐           ┌───────────────┐
│  users   │           │   clients     │ ← NEW MASTER ENTITY
│          │───────────│               │
│ id       │   1:N     │ id            │
│ email    │           │ userId ────┐  │
│ role     │           │ clientName  │  │
│ ...      │           │ panNumber   │  │
└──────────┘           │ kycStatus   │  │
                       │ status      │  │
                       └─────────────┘  │
                                        │
                       ┌────────────────┼───────────────────┐
                       │                │                   │
                       ▼                ▼                   ▼
              ┌──────────────┐  ┌────────────┐    ┌──────────────┐
              │ applications │  │ documents  │    │ audit_logs   │
              │              │  │            │    │              │
              │ id           │  │ id         │    │ id           │
              │ clientId ────┤  │ clientId ──┤    │ entityType   │
              │ userId       │  │ type       │    │ entityId     │
              │ serviceId    │  │ verifyStatus│    │ action       │
              │ status       │  │ isReusable │    │ performedBy  │
              │ ...          │  │ ...        │    │ changes      │
              └──────┬───────┘  └────────────┘    │ timestamp    │
                     │                             │ ipAddress    │
                     │                             └──────────────┘
                     ▼
              ┌──────────────┐
              │   payments   │
              │              │
              │ id           │
              │ applicationId│
              │ amount       │
              │ status       │
              │ ...          │
              └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Key Relationships:                                               │
│                                                                  │
│ 1. User (1) ─→ (N) Clients                                      │
│    • One user can have multiple client profiles                 │
│                                                                  │
│ 2. Client (1) ─→ (N) Applications                               │
│    • One client can apply for multiple services                 │
│                                                                  │
│ 3. Client (1) ─→ (N) Documents                                  │
│    • Documents are reusable across applications                 │
│                                                                  │
│ 4. Application (1) ─→ (N) Payments                              │
│    • Track payment history per application                      │
│                                                                  │
│ 5. Any Entity ─→ (N) AuditLogs                                  │
│    • Complete audit trail for compliance                        │
└─────────────────────────────────────────────────────────────────┘
```

This completes the comprehensive flow diagrams for the refactored architecture!
