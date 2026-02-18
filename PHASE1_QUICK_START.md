# Phase 1 Quick Start Guide

## Developer Quick Start

### What Changed in Phase 1?

Phase 1 adds enterprise-grade features to the compliance platform:
- **Automated Compliance Monitoring** - Never miss a deadline
- **Advanced Security** - Token refresh, RBAC, session management
- **Risk Scoring** - Proactive client management
- **Complete Audit Trail** - Track everything
- **Standardized APIs** - Consistent error handling

### Quick Setup

#### 1. Install Dependencies
```bash
pnpm install
```

#### 2. Environment Variables
No new environment variables required! Existing setup works.

```bash
# .env (existing)
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/compliance
REDIS_URL=redis://127.0.0.1:6379
```

#### 3. Start Development Server
```bash
pnpm dev
```

The scheduler starts automatically and will run compliance monitoring jobs.

### New Features You Can Use

#### 1. Refresh Tokens (Authentication)

**Login now returns refresh token:**
```typescript
// POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

// Response
{
  "success": true,
  "user": {...},
  "token": "access-token-15min",        // Short-lived
  "refreshToken": "refresh-token-7days", // Long-lived
  "expiresIn": 900
}
```

**Refresh your access token:**
```typescript
// POST /api/auth/refresh
{
  "refreshToken": "your-refresh-token"
}

// Response
{
  "success": true,
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**Manage sessions:**
```typescript
// GET /api/auth/sessions (authenticated)
// Returns all active sessions with device info

// POST /api/auth/revoke-all-sessions (authenticated)
// Logout from all devices
```

#### 2. Compliance Events

**Create a compliance event:**
```typescript
// POST /api/compliance-events
{
  "clientId": "client-id",
  "serviceType": "GST Filing",
  "complianceType": "filing",
  "frequency": "monthly",
  "dueDate": "2024-03-15T00:00:00Z",
  "description": "GSTR-3B Filing for Feb 2024",
  "priority": "high",
  "lateFeePerDay": 100,
  "interestRate": 1.5
}
```

**Get compliance calendar:**
```typescript
// GET /api/compliance-events/client/:clientId
// Optional query params: startDate, endDate
```

**Generate recurring events:**
```typescript
// POST /api/compliance-events/recurring (admin only)
{
  "clientId": "client-id",
  "serviceType": "GST Filing",
  "complianceType": "filing",
  "frequency": "monthly",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "description": "Monthly GSTR-3B",
  "lateFeePerDay": 100
}
// Creates 12 monthly events
```

**Complete an event:**
```typescript
// PATCH /api/compliance-events/:id/complete
{
  "completedDate": "2024-03-14T10:30:00Z"
}
// Automatically generates next occurrence for recurring events
```

**Get statistics:**
```typescript
// GET /api/compliance-events/stats/summary
// Returns: total, scheduled, due, overdue, completed, waived
```

#### 3. Permission-Based Access Control

**Check permissions in your code:**
```typescript
import { requirePermission } from '../middleware/permission';

// Protect route with permission
router.get(
  '/sensitive-data',
  authenticateToken,
  requirePermission('client', 'read'),
  handler
);
```

**Available roles:**
- `super_admin` - Full access
- `admin` - Most operations
- `compliance_manager` - Compliance management
- `auditor` - Read-only audit access
- `staff` - Limited operations
- `client` - Own data only
- `viewer` - Read-only

**Initialize default permissions (run once):**
```typescript
import { initializeDefaultPermissions } from './server/services/PermissionService';
await initializeDefaultPermissions();
```

#### 4. Risk Scoring

**Client risk scores are automatically updated when:**
- Compliance events become overdue
- Applications are rejected
- Queries remain pending

**Access risk score:**
```typescript
// GET /api/clients/:id
{
  "id": "client-id",
  "clientName": "ABC Company",
  "riskScore": 45,              // 0-100
  "riskLevel": "MEDIUM",        // LOW | MEDIUM | HIGH | CRITICAL
  "riskFactors": ["overdue_filing", "pending_query"],
  "lastRiskAssessment": "2024-03-15T10:00:00Z",
  "missedComplianceCount": 2,
  "overdueFilingsCount": 1,
  ...
}
```

#### 5. State Machine

**Updated application statuses:**
```typescript
type ApplicationStatus = 
  | "draft"
  | "submitted"
  | "under_review"
  | "query_raised"
  | "query_responded"
  | "resubmitted"          // NEW
  | "approved"
  | "rejected"
  | "completed"
  | "monitoring"
  | "active_monitoring"    // NEW
  | "suspended";           // NEW
```

**State transitions are logged automatically** in `StateTransitionLog` model.

#### 6. Standardized API Responses

**All new endpoints use consistent format:**
```typescript
// Success
{
  "success": true,
  "message": "Operation successful",
  "data": {...},
  "metadata": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "hasMore": true
  }
}

// Error
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VAL_001",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "VAL_002"
    }
  ]
}
```

**Use in your routes:**
```typescript
import { sendSuccess, sendError, asyncHandler } from '../utils/apiResponse';

router.get('/endpoint', asyncHandler(async (req, res) => {
  const data = await someService.getData();
  return sendSuccess(res, data, "Data retrieved successfully");
}));
```

### Automated Jobs

These jobs run automatically in the background:

| Job | Schedule | Purpose |
|-----|----------|---------|
| Compliance Detection | Every hour | Detect overdue events |
| Compliance Reminders | Daily 9 AM | Send reminder notifications |
| Token Cleanup | Daily 2 AM | Remove expired tokens |
| ITC Sync | Daily 6 AM | Sync ITC data |
| Filing Reminders | Daily 8 AM | Send filing reminders |
| Compliance Check | Every 6 hours | Check client compliance |
| Data Cleanup | Weekly Sun 3 AM | Clean old logs |

**Manually trigger a job:**
```typescript
import { scheduler } from './config/scheduler';

// Trigger specific job
await scheduler.triggerJob('compliance-event-detection');

// Get job status
const status = scheduler.getJobsStatus();
```

### Database Changes

**New Collections:**
- `complianceevents` - Compliance tracking
- `refreshtokens` - Session management
- `rolepermissions` - RBAC configuration
- `statetransitionlogs` - State history

**Enhanced Collections:**
- `clients` - Risk scoring fields added
- `applications` - New status values
- `payments` - Security fields added
- `auditlogs` - Compliance tracking fields

**No migration required!** All new fields have defaults.

### Testing Your Changes

#### 1. Test Token Refresh
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Demo@1234"}'

# Use refresh token
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your-refresh-token"}'
```

#### 2. Test Compliance Events
```bash
# Create event (need auth token)
curl -X POST http://localhost:8080/api/compliance-events \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId":"client-id",
    "serviceType":"GST",
    "complianceType":"filing",
    "frequency":"monthly",
    "dueDate":"2024-04-15T00:00:00Z",
    "description":"Test Event",
    "priority":"medium"
  }'

# Get events
curl -X GET http://localhost:8080/api/compliance-events \
  -H "Authorization: Bearer your-token"
```

#### 3. Test Permissions
```bash
# Try accessing admin endpoint with regular user
# Should get 403 Forbidden
curl -X POST http://localhost:8080/api/compliance-events/recurring \
  -H "Authorization: Bearer user-token" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Common Patterns

#### 1. Creating a Protected Route with Permissions
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { apiLimiter } from '../middleware/rateLimiter';
import { asyncHandler, sendSuccess } from '../utils/apiResponse';

const router = Router();

router.get(
  '/my-resource',
  apiLimiter,                                    // Rate limit
  authenticateToken,                             // Authenticate
  requirePermission('resource_name', 'read'),    // Check permission
  asyncHandler(async (req, res) => {             // Handle errors
    const data = await myService.getData();
    return sendSuccess(res, data);
  })
);
```

#### 2. Logging State Transitions
```typescript
import { StateTransitionLogModel } from '../models/StateTransitionLog';

await StateTransitionLogModel.create({
  entityType: 'application',
  entityId: applicationId,
  fromState: 'submitted',
  toState: 'under_review',
  transitionType: 'manual',
  triggeredBy: userId,
  triggeredAt: new Date(),
  metadata: { reason: 'Assigned to staff' },
  isValid: true,
  canRollback: false,
});
```

#### 3. Creating Audit Logs
```typescript
import { AuditLogService } from '../services/AuditLogService';

await AuditLogService.log({
  entityType: 'payment',
  entityId: paymentId,
  action: 'payment_recorded',
  changes: { amount: 1000, status: 'completed' },
  performedBy: userId,
  performedAt: new Date().toISOString(),
  complianceImpact: 'info',
});
```

### Troubleshooting

#### Scheduler not running?
```typescript
// Check scheduler status
import { scheduler } from './config/scheduler';
console.log(scheduler.getJobsStatus());

// Manually start if needed
scheduler.start();
```

#### Permission denied?
```typescript
// Check user role
const user = await UserModel.findById(userId);
console.log(user.role); // Should be 'admin', 'staff', or 'user'

// Initialize default permissions
import { initializeDefaultPermissions } from './server/services/PermissionService';
await initializeDefaultPermissions();
```

#### Token expired too soon?
```typescript
// Check if using refresh token flow
// Access tokens expire in 15 minutes by design
// Use refresh token to get new access token
```

### Best Practices

1. **Always use refresh tokens** - Don't rely on long-lived access tokens
2. **Check permissions explicitly** - Use middleware for consistent enforcement
3. **Log state changes** - Use StateTransitionLog for audit trail
4. **Handle errors consistently** - Use asyncHandler and standard responses
5. **Rate limit endpoints** - Always add apiLimiter to routes
6. **Paginate results** - Use sendPaginatedSuccess for lists
7. **Track compliance** - Create compliance events for deadlines

### Need Help?

- Check `PHASE1_IMPLEMENTATION_SUMMARY.md` for detailed documentation
- Review test files in the repository
- Look at existing implementations in `server/routes/complianceEvents.ts`
- Check the error codes in `shared/compliance.ts`

### Contributing

When adding new features:
1. Follow existing patterns (see examples above)
2. Add rate limiting to all routes
3. Use standardized response format
4. Check permissions where needed
5. Log important state changes
6. Add database indexes for new queries
7. Run CodeQL security check
8. Update documentation

### Summary

Phase 1 is production-ready with:
- ✅ Enhanced security (token refresh, RBAC)
- ✅ Automated compliance monitoring
- ✅ Risk scoring and tracking
- ✅ Complete audit trail
- ✅ Standardized APIs
- ✅ Zero breaking changes

All features work alongside existing functionality. Start using them in your code today!
