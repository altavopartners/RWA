# 📚 Documentation Index

## Getting Started

- [`QUICK_START.md`](./QUICK_START.md) - Quick start guide for development setup
- [`README.md`](../README.md) - Project overview and main documentation

## Architecture & Design

- [`CLEANUP_REPORT.md`](./CLEANUP_REPORT.md) - Code cleanup audit and architecture review
- [`COMPREHENSIVE_CODE_AUDIT.md`](./COMPREHENSIVE_CODE_AUDIT.md) - Detailed code analysis
- [`WORKFLOW_VISUAL_GUIDE.md`](./WORKFLOW_VISUAL_GUIDE.md) - Visual workflow diagrams

## Implementation Guides

- [`BANK_WORKFLOW_IMPLEMENTATION.md`](./BANK_WORKFLOW_IMPLEMENTATION.md) - Bank approval workflow
- [`DOCUMENT_REQUIREMENTS.md`](./DOCUMENT_REQUIREMENTS.md) - Document handling requirements
- [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) - Testing procedures and guidelines

## Project Structure

```
RWA/
├── client/                 # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities and API client
│   ├── types/             # TypeScript types
│   └── styles/            # Global styles
├── server/                # Express backend
│   ├── controllers/       # Route handlers
│   ├── services/          # Business logic
│   ├── models/            # Database models
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── config/            # Configuration
│   ├── utils/             # Utilities
│   ├── types/             # TypeScript types
│   └── prisma/            # Database & migrations
├── hedera-escrow/         # Solidity smart contracts
├── docs/                  # Documentation
└── docker-compose.yml     # Docker Compose config
```

## Key Technologies

- **Frontend**: Next.js 15, React 19, TypeScript, Shadcn UI, TailwindCSS
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Blockchain**: Hedera Testnet, Solidity smart contracts
- **Storage**: IPFS (via Storacha/Web3.Storage)
- **Authentication**: JWT, MetaMask, Hashpack

## Common Tasks

### Development Setup

See [`QUICK_START.md`](./QUICK_START.md)

### Running Tests

See [`TESTING_GUIDE.md`](./TESTING_GUIDE.md)

### Understanding Workflows

See [`WORKFLOW_VISUAL_GUIDE.md`](./WORKFLOW_VISUAL_GUIDE.md) and [`BANK_WORKFLOW_IMPLEMENTATION.md`](./BANK_WORKFLOW_IMPLEMENTATION.md)

### Code Quality

See [`CLEANUP_REPORT.md`](./CLEANUP_REPORT.md) and [`COMPREHENSIVE_CODE_AUDIT.md`](./COMPREHENSIVE_CODE_AUDIT.md)

## Recent Changes (Oct 28, 2025)

✅ **Cleanup Completed**

- Removed debug/test files
- Reorganized documentation
- Updated logging conventions
- Verified build integrity

📋 **Outstanding Tasks**

- Component reorganization (by domain)
- Environment-based logging implementation
- Additional test coverage

## Support & Questions

For questions about the project structure or architecture, refer to the relevant documentation file or create an issue.

---

**Last Updated**: October 28, 2025  
**Project**: Real World Assets (RWA) Platform  
**Status**: Active Development
