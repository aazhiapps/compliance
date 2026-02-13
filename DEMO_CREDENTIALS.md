# ComplianCe - Demo Credentials & Testing Guide

## 🎯 Quick Start

The application comes pre-seeded with demo users for testing all features. All demo accounts are immediately available for login.

---

## 👤 Demo User Accounts

### 1. Regular User - Basic Demo Account
**Email:** `demo@example.com`  
**Password:** `Demo@1234`  
**Role:** User  
**Business Type:** Individual  
**Language:** English  
**Phone:** +91 98765 43210

**What you can do:**
- ✅ Access user dashboard at `/dashboard`
- ✅ View sample applications
- ✅ Track application status
- ✅ Browse services and start new applications
- ✅ Upload documents
- ✅ Make payments via Razorpay

**Pre-seeded Applications:**
- GST Registration (Status: Approved)
- Company Registration (Status: Under Review)

---

### 2. Regular User - Startup Business
**Email:** `rajesh@example.com`  
**Password:** `Rajesh@1234`  
**Role:** User  
**Business Type:** Startup  
**Language:** English  
**Phone:** +91 98765 43211

**What you can do:**
- ✅ All user features (see above)
- ✅ Create and manage startup registrations
- ✅ Access startup-specific services

**Pre-seeded Applications:**
- PAN Registration (Status: Submitted)

---

### 3. Regular User - Company Account
**Email:** `priya@example.com`  
**Password:** `Priya@1234`  
**Role:** User  
**Business Type:** Company  
**Language:** Hindi  
**Phone:** +91 98765 43212

**What you can do:**
- ✅ All user features
- ✅ Company-specific compliance services
- ✅ Multi-user management (future feature)

---

### 4. Admin Account
**Email:** `admin@example.com`  
**Password:** `Admin@1234`  
**Role:** Admin  
**Business Type:** Company  
**Language:** English  
**Phone:** +91 98765 50000

**What you can do:**
- ✅ Access admin dashboard at `/admin`
- ✅ View all customers and applications
- ✅ Manage customer accounts
- ✅ Review and approve/reject applications
- ✅ View payment details
- ✅ Monitor platform analytics
- ✅ Assign staff to applications
- ✅ Manage staff members

**Admin Features:**
- Customer management with search/filter
- Application review panel
- Payment tracking
- Performance analytics
- Staff assignment and management

---

### 5. Staff Account 1
**Email:** `staff@example.com`  
**Password:** `Staff@1234`  
**Role:** Staff  
**Business Type:** Company  
**Language:** English  
**Phone:** +91 98765 60000

**What you can do:**
- ✅ Access staff dashboard at `/staff`
- ✅ View assigned applications
- ✅ Update application status
- ✅ Add internal notes (not visible to customers)
- ✅ Process customer requests
- ✅ Track staff performance metrics

**Staff Features:**
- View assigned applications
- Update application status
- Add internal processing notes
- Track personal statistics

---

### 6. Staff Account 2
**Email:** `sarah@example.com`  
**Password:** `Sarah@1234`  
**Role:** Staff  
**Business Type:** Company  
**Language:** English  
**Phone:** +91 98765 60001

**Features:** Same as Staff Account 1

---

## 🧪 Testing Scenarios

### Scenario 1: Complete User Journey
1. Sign up with new account at `/signup`
2. Log in at `/login`
3. Go to `/` → Click on a service
4. Click "Begin Application"
5. Upload documents in multi-step checkout
6. Complete payment (Razorpay test mode)
7. View application in dashboard
8. Track status at `/application/:id`

### Scenario 2: Admin Review
1. Log in with admin account
2. Go to `/admin`
3. View "Overview" tab - see customers and applications
4. Click "Customers" tab - search/filter customers
5. Click "Applications" tab - review submissions
6. Assign applications to staff members
7. See application details and update status

### Scenario 3: Staff Processing
1. Log in with staff account (`staff@example.com`)
2. Go to `/staff` to access staff dashboard
3. View assigned applications
4. Click "Manage" on an application
5. Add internal notes for processing
6. Update application status (under review, approved, rejected)
7. View personal statistics

### Scenario 4: Service Browsing
1. Visit homepage `/`
2. View service catalog
3. Click on service cards (expandable)
4. Click "Learn More" for details page
5. See pricing, turnaround, requirements
6. Click "Begin Application" to start checkout

### Scenario 5: Dashboard Management
1. Log in as regular user
2. View `/dashboard`
3. See application statistics
4. Click on application to view details
5. Check document status
6. View assigned staff contact

---

## 💳 Payment Testing (Razorpay)

The checkout flow is configured for **Razorpay test mode**.

### Test Cards (from Razorpay documentation):
- **Visa Success:** 4111 1111 1111 1111
- **Mastercard Success:** 5555 5555 5555 4444
- **Amex Success:** 3782 822463 10005

**Expiry:** Any future date (e.g., 12/25)  
**CVV:** Any 3-digit number (e.g., 123)

⚠️ **Note:** Test payments won't process real charges.

---

## 🎨 Feature Showcase

### User Features
- ✅ Multi-language support (English/Hindi)
- ✅ Service catalog with pricing
- ✅ Multi-step checkout wizard
- ✅ Document upload with validation
- ✅ Payment integration
- ✅ Application dashboard
- ✅ Real-time status tracking
- ✅ Executive assignment

### Admin Features
- ✅ Customer management panel
- ✅ Application review interface
- ✅ Payment tracking
- ✅ Analytics dashboard
- ✅ Search and filter capabilities
- ✅ Customer approval workflows
- ✅ Staff management and assignment

### Staff Features
- ✅ Staff dashboard with personal statistics
- ✅ View assigned applications
- ✅ Update application status
- ✅ Add internal processing notes
- ✅ Track performance metrics
- ✅ Manage customer requests

---

## 📋 API Endpoints

All API endpoints require authentication token (except signup/login).

### Auth Endpoints
```
POST   /api/auth/signup          - Create new account
POST   /api/auth/login           - Login and get token
GET    /api/auth/profile         - Get current user profile
POST   /api/auth/logout          - Logout
```

### Staff Endpoints (Requires Staff or Admin Role)
```
GET    /api/staff/applications   - Get staff member's assigned applications
PATCH  /api/staff/applications/:id - Update application status and add notes
GET    /api/staff/stats          - Get staff member's statistics
GET    /api/staff/members        - Get all staff members (admin only)
POST   /api/staff/assign/:id     - Assign application to staff (admin only)
```

### Application Endpoints
```
GET    /api/applications         - Get user's applications
POST   /api/applications         - Create new application
POST   /api/applications/:id/documents - Upload document
```

### Authorization Header
```
Authorization: Bearer <token_from_login>
```

---

## 🔐 Security Notes

⚠️ **This is a DEMO application with mock authentication**

In production, you should:
- Use bcrypt for password hashing
- Use proper JWT tokens with signing
- Store users in a real database (MongoDB, PostgreSQL, etc.)
- Implement refresh tokens
- Add rate limiting
- Use HTTPS only
- Implement proper CORS
- Add email verification
- Implement OAuth for social login

---

## 🛠️ Developer Notes

### In-Memory Storage
Currently using JavaScript Maps for storage (not persisted between restarts).

To upgrade:
```typescript
// Replace Maps with database calls
// users.set() → db.users.create()
// users.get() → db.users.findOne()
```

### Environment Variables
Add to `.env`:
```
RAZORPAY_KEY_ID=your_test_key
RAZORPAY_KEY_SECRET=your_test_secret
DATABASE_URL=your_db_url
JWT_SECRET=your_secret
```

---

## ✅ Testing Checklist

- [ ] Sign up with new credentials
- [ ] Log in with demo account
- [ ] View dashboard
- [ ] Browse services
- [ ] View service details
- [ ] Start checkout process
- [ ] Upload documents
- [ ] Review application
- [ ] Complete payment
- [ ] View application tracking
- [ ] Log in as admin
- [ ] View admin dashboard
- [ ] Search users
- [ ] Review applications

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Review backend logs
3. Verify all imports are correct
4. Clear localStorage and try again
5. Restart dev server

---

**Version:** 1.0  
**Last Updated:** February 2024  
**Status:** Demo/Testing Ready ✅
