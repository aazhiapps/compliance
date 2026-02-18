# ComplianCe - Compliance Management Platform

A production-ready full-stack compliance management application built with React, TypeScript, Express, and modern tooling. This platform helps businesses manage their compliance requirements, applications, document submissions, and payments.

## 🚀 Features

- **User Management** - Secure authentication with JWT tokens
- **Service Catalog** - Browse and apply for compliance services (GST, PAN, Company Registration, etc.)
- **Application Tracking** - Real-time status tracking for all applications
- **Document Management** - Secure document upload and management
- **Payment Integration** - Razorpay payment gateway integration
- **Admin Dashboard** - Comprehensive admin panel for managing users, applications, and payments
- **Multi-language Support** - English and Hindi language support
- **Responsive Design** - Mobile-friendly UI with TailwindCSS

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router 6** - SPA routing
- **TailwindCSS 3** - Styling
- **Radix UI** - Component library
- **Tanstack Query** - Data fetching and caching
- **Lucide React** - Icons

### Backend

- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **JWT** - Authentication
- **Zod** - Schema validation
- **Bcrypt** - Password hashing

### Development Tools

- **Vitest** - Testing framework
- **PNPM** - Package manager
- **Prettier** - Code formatting

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PNPM** (v10 or higher) - `npm install -g pnpm`

## 🚦 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/aazhiapps/compliance.git
cd compliance
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory. You can copy from the example:

```bash
cp .env.example .env
```

Then update the `.env` file with your configuration:

```bash
# JWT Secret - REQUIRED (minimum 32 characters)
# Generate with: openssl rand -base64 32
JWT_SECRET=your-secure-secret-key-here-min-32-characters

# Server Configuration
PORT=8080
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=*

# Builder.io (Optional)
VITE_PUBLIC_BUILDER_KEY=your_builder_key

# Razorpay Configuration (Required for payments)
VITE_RAZORPAY_KEY=rzp_test_YOUR_KEY

# Optional
PING_MESSAGE="ping pong"
```

### 4. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:8080`

## 🎯 Quick Start with Demo Accounts

The application comes with pre-seeded demo accounts. See [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) for complete login credentials and testing guide.

**Quick Demo Access:**

- **User Account:** `demo@example.com` / `Demo@1234`
- **Admin Account:** `admin@example.com` / `Admin@1234`

## 📁 Project Structure

```
compliance/
├── client/                    # React frontend application
│   ├── components/            # Reusable React components
│   │   └── ui/                # UI component library (Radix UI)
│   ├── contexts/              # React contexts (Auth, etc.)
│   ├── hooks/                 # Custom React hooks
│   ├── pages/                 # Page components (routes)
│   ├── lib/                   # Utility functions
│   ├── App.tsx                # App entry point with routing
│   └── global.css             # Global styles and Tailwind config
│
├── server/                    # Express backend application
│   ├── config/                # Configuration files
│   │   └── env.ts             # Environment validation
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts            # JWT authentication
│   │   ├── validation.ts      # Request validation
│   │   ├── errorHandler.ts   # Error handling
│   │   ├── logging.ts         # Request logging
│   │   └── rateLimiter.ts    # Rate limiting
│   ├── repositories/          # Data access layer
│   ├── routes/                # API route handlers
│   ├── utils/                 # Utility functions
│   ├── index.ts               # Server setup and configuration
│   └── node-build.ts          # Production build entry
│
├── shared/                    # Shared types between client/server
│   └── api.ts                 # API type definitions
│
├── public/                    # Static assets
├── dist/                      # Build output (generated)
├── .env                       # Environment variables (create from .env.example)
└── package.json               # Dependencies and scripts
```

## 🔧 Available Scripts

```bash
# Development
pnpm dev          # Start dev server with hot reload (client + server)

# Building
pnpm build        # Build both client and server for production
pnpm build:client # Build only client
pnpm build:server # Build only server

# Production
pnpm start        # Start production server

# Testing
pnpm test         # Run tests with Vitest

# Code Quality
pnpm typecheck    # Run TypeScript type checking
pnpm format.fix   # Format code with Prettier
```

## 🔐 Authentication & Security

- **JWT-based authentication** with secure token handling
- **Bcrypt password hashing** for user credentials
- **Rate limiting** on authentication endpoints (5 attempts per 15 minutes)
- **Request validation** using Zod schemas
- **CORS configuration** for API security
- **Environment variable validation** on startup

For detailed security architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🧪 Testing

The application includes a comprehensive testing infrastructure:

```bash
# Run all tests
pnpm test

# Run type checking
pnpm typecheck
```

See [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) for detailed testing scenarios and user flows.

## 💳 Payment Integration

The application uses **Razorpay** for payment processing:

1. Sign up for a Razorpay account at https://razorpay.com
2. Get your test API keys from the dashboard
3. Add keys to your `.env` file:
   ```
   VITE_RAZORPAY_KEY=rzp_test_YOUR_KEY
   ```

For test card numbers and payment testing guide, see [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md)

## 🚀 Deployment

### Standard Deployment

Build the application:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

### Cloud Deployment

The application can be deployed to various platforms:

- **Netlify** - See `netlify.toml` for configuration
- **Vercel** - Supports both frontend and serverless functions
- **Docker** - See `.dockerignore` for Docker configuration

### Environment Variables for Production

Ensure these are set in your production environment:

- `JWT_SECRET` - Must be at least 32 characters (generate with `openssl rand -base64 32`)
- `NODE_ENV=production`
- `CORS_ORIGIN` - Set to your frontend domain
- `VITE_RAZORPAY_KEY` - Production Razorpay key

⚠️ **Never use the demo JWT secret in production!**

## 📚 Additional Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture decisions, middleware layer, security features
- **[DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md)** - Demo accounts, testing guide, API endpoints
- **[IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md)** - Recent improvements and updates
- **[AGENTS.md](./AGENTS.md)** - Development agents and tooling information

## 🎨 Key Features in Detail

### User Features

- ✅ Secure signup and login
- ✅ Service catalog with detailed information
- ✅ Multi-step application wizard
- ✅ Document upload with validation
- ✅ Application status tracking
- ✅ Payment processing
- ✅ User dashboard
- ✅ Multi-language support

### Admin Features

- ✅ User management panel
- ✅ Application review interface
- ✅ Payment tracking and reconciliation
- ✅ Analytics dashboard
- ✅ Service management
- ✅ Document review
- ✅ Search and filter capabilities

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**

```bash
# Change PORT in .env file
PORT=3000
```

**JWT Secret Error:**

```bash
# Generate a secure secret
openssl rand -base64 32
# Add to .env file as JWT_SECRET
```

**Build Errors:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Type Errors:**

```bash
# Run type checking to see all errors
pnpm typecheck
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 📞 Support

For issues, questions, or support:

1. Check the documentation files
2. Review the [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) for testing guides
3. Check browser console and server logs for errors
4. Create an issue in the repository

## 🎯 Roadmap

Future enhancements planned:

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Advanced reporting and analytics
- [ ] Export functionality (PDF reports)
- [ ] Mobile app (React Native)
- [ ] Two-factor authentication
- [ ] OAuth social login
- [ ] Advanced search and filtering
- [ ] Bulk operations

---

**Built with ❤️ using the Fusion Starter template**

Version: 1.0.0  
Last Updated: February 2026
