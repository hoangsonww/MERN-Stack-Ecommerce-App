# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fusion Electronics** is a production-ready MERN stack e-commerce application with AI-powered product recommendations using vector databases (Pinecone, Weaviate, FAISS). The project consists of a React frontend, Express.js backend, MongoDB database, and vector database integrations for semantic product search and recommendations.

## Essential Commands

### Development Setup

```bash
# Install dependencies
npm install                          # Frontend
cd backend && npm install            # Backend

# Database seeding
cd backend/seed && node productSeeds.js dev

# Sync vector databases (required for recommendations)
cd backend && npm run sync-pinecone  # Primary vector DB
```

### Running the Application

```bash
# Development mode - both servers concurrently
npm run dev

# Or run separately:
npm start                            # Frontend (port 3000)
cd backend && npm start              # Backend (port 5000)
```

### Testing

```bash
# Frontend tests
npm test                             # Run all tests
npm run test:watch                   # Watch mode
npm run test:coverage                # With coverage

# Backend tests
cd backend && npm test               # Run all tests
cd backend && npm run test:watch     # Watch mode
cd backend && npm run test:coverage  # With coverage
```

### Build & Deployment

```bash
# Frontend production build
npm run build

# Docker
docker compose up --build

# Code formatting
npm run format                       # Format all code
npm run lint                         # Lint all code
```

### Vector Database Operations

```bash
cd backend

# Pinecone (primary)
npm run sync-pinecone                # Full sync MongoDB → Pinecone

# Weaviate (optional)
npm run weaviate-upsert              # Initial upsert
npm run sync-weaviate                # Sync IDs
npm run weaviate-query               # Query test

# FAISS (optional, local)
npm run faiss-upsert                 # Build index
npm run faiss-search -- "query" 5    # Search with top 5
```

## High-Level Architecture

### Monorepo Structure

This is a **workspace-based monorepo** with the frontend in the root directory and backend in `backend/`. The two parts communicate via REST API with a development proxy configured in `setupProxy.js`.

### Key Architectural Patterns

1. **Stateless Backend**: All API endpoints are stateless, enabling horizontal scaling. No server-side sessions—authentication is JWT-based.

2. **Vector-First Recommendations**: Product recommendations are powered by **Pinecone** vector similarity search using Google AI text embeddings (768-dimensional vectors). The system automatically:
   - Syncs products to Pinecone on creation/update/deletion via Mongoose hooks
   - Generates embeddings from `name + description + category + brand`
   - Falls back to heuristic scoring if vector search fails

3. **Dual Database Architecture**:
   - **MongoDB**: Primary data store for products, users, orders
   - **Pinecone**: Vector database for semantic similarity search
   - Optional: Weaviate and FAISS for experimentation

4. **Auto-Sync Pipeline**: Product changes in MongoDB automatically propagate to Pinecone through Mongoose middleware hooks (`backend/models/product.js:68-117`). This ensures vector embeddings stay in sync without manual intervention.

### Critical Data Flow: Product Recommendations

```
User views Product X
  → Frontend: GET /api/products/:id/similar
    → Backend queries Pinecone using product's pineconeId
      → Pinecone returns top 5 similar vectors (cosine similarity)
        → Backend loads full product documents from MongoDB
          → Frontend displays recommendations
            ↓
    [If Pinecone fails]
      → Backend applies heuristic scoring:
         • Category match: +3 points
         • Brand match: +2 points
         • Name/description similarity: +3/+1 points
         • Price affinity: +2 points
```

**Key Files**:
- Recommendation logic: `backend/routes/products.js:218-332`
- Pinecone client: `backend/pineconeClient.js`
- Sync service: `backend/services/pineconeSync.js`
- Auto-sync hooks: `backend/models/product.js:68-117`

### Frontend Architecture

**State Management**: React Context API for global cart state (`App.jsx`), with localStorage persistence (`fusionCart` key). No Redux—intentionally simple for this project size.

**API Client**: Centralized Axios instance with exponential backoff retry logic (`src/services/apiClient.js`). All API calls should use `withRetry()` wrapper for resilience.

**Routing**: Client-side routing via React Router v6 with `ScrollToTop` component to auto-scroll on navigation.

**Key Components**:
- `NavigationBar.jsx`: Search bar, logo, cart badge
- `ProductCard.jsx`: Reusable product tile used in Home, Shop, ProductDetails
- `CheckoutForm.jsx`: Payment form with react-credit-cards-2 visualization

## Environment Variables

**Required** (`backend/.env`):
```env
MONGO_URI=mongodb://localhost:27017/Ecommerce-Products
JWT_SECRET=your_jwt_secret
PINECONE_API_KEY=pk-xxx
PINECONE_HOST=https://your-index.svc.us-east-1.pinecone.io
PINECONE_INDEX=ecommerce-products
GOOGLE_AI_API_KEY=AIzaSy...
```

**Optional**:
```env
PINECONE_NAMESPACE=ecommerce-products
PINECONE_PURGE_ON_SYNC=true          # Clear namespace before sync
WEAVIATE_HOST=https://xxx.weaviate.network
WEAVIATE_API_KEY=xxx
RECOMMENDATION_PREFER_WEAVIATE=false  # Use Weaviate over Pinecone
PORT=5000
```

## Important Implementation Details

### 1. Product Model with Auto-Sync

The Product schema (`backend/models/product.js`) includes special fields:
- `pineconeId`: Vector ID in Pinecone (auto-populated)
- `weaviateId`: Vector ID in Weaviate (optional)

**Mongoose hooks automatically sync to Pinecone**:
- `post('save')`: Syncs new/updated products
- `post('findOneAndUpdate')`: Syncs on updates
- `post('deleteOne')`, `post('findOneAndDelete')`: Removes vectors

**Important**: When updating products, changes to `name`, `description`, `category`, `brand`, or `price` trigger re-embedding. Other fields (like `stock`, `rating`) do not.

### 2. Checkout Validation

The checkout endpoint (`backend/routes/checkout.js`) validates:
- Email format (regex)
- Card number (16 digits)
- Expiry format (MM/YY)
- CVC (3-4 digits)

**Note**: This is a **demo checkout** with a 3-second simulated delay. There's no actual payment gateway, order persistence, or Stripe integration. Orders are not saved to the database.

### 3. Search Implementation

Current search (`backend/routes/search.js`) uses **MongoDB regex** on `name` and `description` fields. This is case-insensitive but not semantic.

**Enhancement opportunity**: The codebase is structured to easily add vector-based semantic search (see `AGENTS.md` Task 4 for implementation guide).

### 4. API Documentation

Swagger UI is available at `http://localhost:5000/api-docs` when the backend is running. The OpenAPI spec is also available in `openapi.yaml` at the project root.

### 5. Testing Philosophy

- **Backend tests**: Use Supertest to test HTTP endpoints. Mock external services (Pinecone, Google AI) to avoid rate limits and flaky tests.
- **Frontend tests**: Use React Testing Library with `render()` and `screen` queries. Mock API responses with `jest.mock()`.

All tests should pass before deployment. CI/CD pipeline (`github/workflows/ci.yml`) runs tests automatically.

## Common Development Tasks

### Adding a New API Endpoint

1. Create route handler in `backend/routes/` (or add to existing file)
2. Register route in `backend/index.js` (e.g., `app.use('/api/newroute', require('./routes/newroute'))`)
3. Add Swagger JSDoc comments for API documentation
4. Write integration tests in `backend/__tests__/`
5. Update this CLAUDE.md if the endpoint introduces new patterns

### Adding a New React Page

1. Create page component in `src/pages/`
2. Add route in `src/App.jsx` within `<Routes>`
3. Link from existing pages (e.g., `NavigationBar.jsx`)
4. Write tests in `src/tests/`

### Modifying Product Schema

**Critical**: If you add fields that should influence recommendations:
1. Update the text extraction in `backend/services/pineconeSync.js` to include new fields
2. Re-run `npm run sync-pinecone` to update all vectors
3. Update the Product model in `backend/models/product.js`
4. Update Swagger documentation and TypeScript types (if added)

### Debugging Vector Search Issues

If recommendations return empty or irrelevant results:
1. Verify Pinecone index exists: Check Pinecone dashboard
2. Check products have `pineconeId` populated: Query MongoDB
3. Verify embeddings are generated: Check Google AI API quota
4. Test sync manually: `cd backend && npm run sync-pinecone`
5. Check logs for errors during auto-sync (Mongoose hooks)

Common issue: **Purge flag is true** by default. If `PINECONE_PURGE_ON_SYNC=true`, the sync script clears all vectors before re-syncing. Set to `false` to preserve existing vectors.

## Deployment Architecture

### Current Production Deployments

**Frontend**: Deployed on Vercel with automatic builds on push to `main`. Build command: `npm run build`, output directory: `build/`.

**Backend**: Primary deployment on Vercel (serverless functions), backup on Render (Docker container, free tier with cold starts).

**Database**: MongoDB Atlas (cloud-hosted, auto-scaling).

**Vector DB**: Pinecone serverless index (AWS us-east-1, free tier with 100K vectors).

**CI/CD**: GitHub Actions workflow runs linting, testing, and builds on every push.

### Enterprise Kubernetes Deployment (New)

The application now supports production-ready Kubernetes deployments with advanced deployment strategies:

#### Deployment Strategies

1. **Blue-Green Deployment**
   - Zero-downtime deployments
   - Instant rollback capability
   - Two identical environments (blue and green)
   - Traffic switching via service selector update
   - Scripts: `deployment/scripts/blue-green-deploy.sh`
   - Manifests: `deployment/k8s/blue-green/`

2. **Canary Deployment**
   - Gradual traffic shifting (10% → 25% → 50% → 75% → 100%)
   - Real-time monitoring and automatic rollback
   - Progressive validation before full rollout
   - Scripts: `deployment/scripts/canary-deploy.sh`
   - Manifests: `deployment/k8s/canary/`

3. **Rolling Update**
   - Standard Kubernetes rolling update
   - Configurable max surge and max unavailable
   - Automatic health checks during rollout

#### Jenkins CI/CD Pipeline

The `Jenkinsfile` provides a comprehensive CI/CD pipeline with:

- **Build Stages**: Dependency installation, linting, testing, Docker image building
- **Security**: Vulnerability scanning with `npm audit`
- **Testing**: Unit, integration, and API tests
- **Deployment**: Parameterized deployment strategy selection
- **Health Checks**: Automated health verification after deployment
- **Smoke Tests**: Critical functionality validation
- **Rollback**: Automatic rollback on failure

**Usage**:
```bash
# Via Jenkins UI: Select deployment strategy and parameters
# Via CLI:
jenkins-cli build fusion-electronics \
  -p DEPLOYMENT_STRATEGY=blue-green \
  -p RUN_SMOKE_TESTS=true
```

#### Infrastructure Components

**Kubernetes Manifests**:
- **Namespace**: `deployment/k8s/namespace.yaml`
- **ConfigMap**: Application configuration
- **Secrets**: Sensitive credentials (template provided)
- **Deployments**: Blue/Green and Canary variants
- **Services**: LoadBalancer services for frontend and backend
- **Ingress**: NGINX ingress with TLS and rate limiting
- **HPA**: Horizontal Pod Autoscaler (CPU and memory-based)
- **PDB**: Pod Disruption Budget for high availability
- **Network Policies**: Network segmentation and security

**Deployment Scripts**:
- `blue-green-deploy.sh`: Blue-green deployment orchestration
- `canary-deploy.sh`: Canary deployment with traffic management
- `health-check.sh`: Comprehensive health validation
- `monitor-canary.sh`: Real-time canary monitoring
- `rollback.sh`: Automated rollback procedures
- `smoke-tests.sh`: Post-deployment smoke tests
- `performance-tests.sh`: Load and performance testing

#### Monitoring and Health Checks

**Health Check Endpoints**:
- `/health`: Basic liveness check
- `/health/ready`: Readiness check (includes DB connectivity)
- `/health/db`: Database connectivity check
- `/health/pinecone`: Vector DB connectivity check

**Monitoring Metrics**:
- Pod CPU and memory usage
- Request rate and error rate
- Response time (p50, p95, p99)
- Database connection pool status
- Vector search latency

**Probes Configuration**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 60
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 5
```

#### Rollback Procedures

**Automatic Rollback**:
- Triggered on failed health checks
- Triggered on failed smoke tests
- Triggered on error rate > 5%
- Triggered on deployment timeout

**Manual Rollback**:
```bash
# Blue-green rollback
bash deployment/scripts/blue-green-deploy.sh switch-to-blue

# Canary rollback
bash deployment/scripts/canary-deploy.sh rollback

# Auto-detect and rollback
bash deployment/scripts/rollback.sh auto
```

#### Deployment Workflow Example

**Blue-Green Deployment**:
```bash
# 1. Deploy to green environment
bash deployment/scripts/blue-green-deploy.sh deploy-green

# 2. Health check
bash deployment/scripts/health-check.sh green

# 3. Smoke tests
bash deployment/scripts/smoke-tests.sh

# 4. Switch traffic (requires approval in Jenkins)
bash deployment/scripts/blue-green-deploy.sh switch-to-green

# 5. Cleanup old environment
bash deployment/scripts/blue-green-deploy.sh cleanup-blue
```

**Canary Deployment**:
```bash
# 1. Deploy canary with 10% traffic
export CANARY_PERCENTAGE=10
bash deployment/scripts/canary-deploy.sh deploy-canary

# 2. Monitor for 5 minutes
bash deployment/scripts/monitor-canary.sh

# 3. Gradually increase traffic (25%, 50%, 75%)
# ... monitoring at each stage ...

# 4. Promote to 100%
bash deployment/scripts/canary-deploy.sh promote-canary
```

For complete deployment documentation, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Performance Considerations

1. **Vector search latency**: Pinecone queries are typically <100ms but can timeout. Always have fallback logic (heuristic scoring is already implemented).

2. **Embedding API rate limits**: Google Generative AI has rate limits. The sync script processes products sequentially to avoid hitting limits. For bulk operations, add rate limiting.

3. **MongoDB indexes**: The Product model has indexes on `name`, `category`, `brand`, `rating`, and a text index on `name + description`. Don't remove these—they're critical for query performance.

4. **Frontend bundle size**: The app uses Material-UI which adds ~300KB gzipped. Consider code splitting if adding heavy dependencies.

## Security Notes

- **JWT_SECRET**: Must be strong and random in production. Current default is for dev only.
- **Password hashing**: Implemented with bcryptjs (10 rounds) in User model.
- **CORS**: Configured in `backend/index.js`. Update allowed origins for production.
- **Input validation**: Checkout endpoint validates card format, but other endpoints lack comprehensive validation. Consider adding express-validator middleware.
- **Rate limiting**: Not currently implemented. Add for production to prevent abuse.

## Troubleshooting Quick Reference

**"Network Error" in frontend**:
- Check backend is running on port 5000
- Verify `setupProxy.js` is configured correctly
- Check CORS settings in `backend/index.js`

**Empty recommendations**:
- Run `npm run sync-pinecone` in backend
- Check `PINECONE_API_KEY` and `GOOGLE_AI_API_KEY` in `.env`
- Verify products have `pineconeId` field populated

**Tests failing**:
- Delete `node_modules` and `package-lock.json`, reinstall
- Check `jest.config.js` for correct module paths
- Verify test database connection in test setup

**Docker build fails**:
- Ensure `.dockerignore` excludes `node_modules`
- Check Node version in `Dockerfile` matches local version
- Test locally: `docker build -t fusion-app .`

## Additional Context

**Project maturity**: This is a working demo/portfolio project with production-ready architecture but simplified business logic (no real payments, order management, or admin dashboard).

**Vector DB flexibility**: The codebase supports multiple vector databases (Pinecone, Weaviate, FAISS) to allow experimentation. Pinecone is primary; others are optional.

**Documentation sources**: See `README.md` for user-facing docs, `ARCHITECTURE.md` for detailed system design, and `AGENTS.md` for comprehensive AI agent instructions with step-by-step examples.

**API versioning**: Not currently implemented. All endpoints are under `/api/`. If breaking changes are needed, consider versioning (e.g., `/api/v2/`).

---

**For detailed task examples and troubleshooting, refer to AGENTS.md.**
