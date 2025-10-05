# AI Coding Agent Instructions for Fusion Electronics E-commerce

## Project Overview

**Fusion Electronics** is a production-ready, full-stack MERN (MongoDB, Express, React, Node.js) e-commerce application featuring:
- Product browsing, search, and detailed views
- Shopping cart and checkout flow with validation
- User authentication (JWT-based)
- AI-powered product recommendations using **Pinecone** (primary), **Weaviate**, **FAISS**, and **LangChain**
- Comprehensive API documentation via Swagger
- Unit and integration testing (Jest, React Testing Library)
- CI/CD pipeline with GitHub Actions
- Docker containerization support

---

## Repository Structure

```
project-root/
├── backend/                      # Node.js + Express API server
│   ├── config/                   # Database configuration
│   │   └── db.js                # MongoDB connection setup
│   ├── docs/                     # API documentation
│   │   └── swagger.js           # Swagger configuration
│   ├── models/                   # Mongoose schemas
│   │   ├── product.js           # Product model with Pinecone hooks
│   │   └── user.js              # User model for authentication
│   ├── routes/                   # Express route handlers
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── checkout.js          # Order creation and validation
│   │   ├── products.js          # Product CRUD and recommendations
│   │   └── search.js            # Product search functionality
│   ├── scripts/                  # Utility scripts
│   │   ├── build-faiss-index.js # FAISS index builder
│   │   ├── search-faiss-index.js# FAISS similarity search
│   │   ├── sync-pinecone.js     # Sync MongoDB → Pinecone
│   │   ├── sync-weaviate-ids.js # Sync MongoDB → Weaviate IDs
│   │   ├── query-weaviate.js    # Weaviate query utility
│   │   └── weaviate-upsert.js   # Weaviate data upsert
│   ├── seed/                     # Database seeding
│   │   └── productSeeds.js      # Initial product data
│   ├── services/                 # Business logic services
│   │   └── pineconeSync.js      # Pinecone synchronization helpers
│   ├── sync/                     # Synchronization modules
│   │   ├── syncPinecone.js      # Main Pinecone sync orchestrator
│   │   └── syncWeaviate.js      # Weaviate sync orchestrator
│   ├── __tests__/                # Backend tests
│   │   ├── auth.spec.js
│   │   ├── checkout.spec.js
│   │   └── search.spec.js
│   ├── pineconeClient.js         # Pinecone SDK client
│   ├── weaviateClient.js         # Weaviate SDK client
│   ├── index.js                  # Express server entry point
│   ├── package.json              # Backend dependencies
│   └── .env                      # Environment variables (not committed)
│
├── src/                          # React frontend
│   ├── components/               # Reusable React components
│   │   ├── CheckoutForm.jsx     # Payment form with validation
│   │   ├── Footer.jsx           # Site footer
│   │   ├── NavigationBar.jsx    # Top navigation with cart badge
│   │   ├── ProductCard.jsx      # Product display card
│   │   ├── ScrollToTop.jsx      # Auto-scroll on route change
│   │   └── SearchResults.jsx    # Search results display
│   ├── context/                  # React Context providers
│   │   └── NotificationProvider.jsx # Toast notifications
│   ├── pages/                    # Page-level components
│   │   ├── About.jsx
│   │   ├── Cart.jsx             # Shopping cart page
│   │   ├── Checkout.jsx         # Checkout page
│   │   ├── ForgotPassword.jsx
│   │   ├── Home.jsx             # Landing page with recommendations
│   │   ├── Login.jsx
│   │   ├── NotFoundPage.jsx
│   │   ├── OrderSuccess.jsx     # Order confirmation
│   │   ├── ProductDetails.jsx   # Single product view
│   │   ├── Register.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── Shop.jsx             # All products listing
│   │   └── Support.jsx
│   ├── services/                 # API client services
│   │   └── apiClient.js         # Axios instance with retry logic
│   ├── tests/                    # Frontend tests
│   │   ├── Cart.test.js
│   │   ├── Checkout.test.js
│   │   ├── Home.test.js
│   │   ├── Login.test.js
│   │   ├── OrderSuccess.test.js
│   │   ├── Register.test.js
│   │   └── Shop.test.js
│   ├── utils/                    # Utility functions
│   │   └── products.js          # Product data helpers
│   ├── App.jsx                   # Root component with routing
│   ├── index.js                  # React entry point
│   └── setupProxy.js             # Development proxy configuration
│
├── public/                       # Static assets
├── docs/                         # Documentation and screenshots
├── .github/workflows/            # CI/CD pipelines
│   └── ci.yml                   # GitHub Actions workflow
├── docker-compose.yml            # Docker orchestration
├── Dockerfile                    # Container definition
├── package.json                  # Frontend dependencies
├── craco.config.js               # Create React App overrides
├── jest.config.js                # Jest configuration
└── README.md                     # User-facing documentation
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js 18.x
- **Framework**: Express.js 4.x
- **Database**: MongoDB 6.x with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Vector Databases**:
  - **Pinecone** (primary, serverless)
  - Weaviate (optional)
  - FAISS (optional, via faiss-node)
- **LLM Integration**: Google Generative AI (`text-embedding-004`) for embeddings
- **API Docs**: Swagger UI (swagger-jsdoc + swagger-ui-express)
- **Testing**: Jest + Supertest
- **Dev Tools**: Nodemon for hot-reloading

### Frontend
- **Framework**: React 18.x
- **UI Library**: Material-UI (MUI) 5.x
- **Routing**: React Router DOM 6.x
- **State Management**: React Context API + Hooks
- **HTTP Client**: Axios with retry logic
- **Form Handling**: React Hook Form (not currently in deps but can be added)
- **Notifications**: Custom NotificationProvider (toast-like)
- **Credit Cards**: react-credit-cards-2
- **Testing**: Jest + React Testing Library
- **Build Tool**: CRACO (Create React App Configuration Override)

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions (testing, linting, building)
- **Deployment**: Vercel (frontend + API routes), Render (backup backend)
- **Version Control**: Git

---

## Development Workflow

### Initial Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd ecommerce-fullstack-website
   npm install                  # Frontend deps
   cd backend && npm install    # Backend deps
   ```

2. **Configure Environment Variables**
   Create `backend/.env`:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/Ecommerce-Products

   # Authentication
   JWT_SECRET=your_jwt_secret_key_here

   # Pinecone (Primary Vector DB - REQUIRED)
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_HOST=https://your-index.svc.us-east-1.pinecone.io
   PINECONE_INDEX=ecommerce-products
   PINECONE_NAMESPACE=ecommerce-products
   PINECONE_PURGE_ON_SYNC=true

   # Google AI (for embeddings)
   GOOGLE_AI_API_KEY=your_google_ai_api_key

   # Weaviate (Optional)
   WEAVIATE_HOST=https://your-instance.weaviate.network
   WEAVIATE_API_KEY=your_weaviate_api_key
   RECOMMENDATION_PREFER_WEAVIATE=false

   # Server
   PORT=5000
   ```

3. **Seed Database**
   ```bash
   cd backend/seed
   node productSeeds.js dev
   ```

4. **Sync Vector Databases**
   ```bash
   cd backend
   npm run sync-pinecone      # Required
   npm run weaviate-upsert    # Optional
   npm run sync-weaviate      # Optional
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1: Backend
   cd backend && npm start

   # Terminal 2: Frontend
   npm start
   ```
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Swagger Docs: http://localhost:5000/api-docs

---

## Core Functionality Guide

### 1. Product Management

#### Product Model (`backend/models/product.js`)
```javascript
{
  name: String (required, unique),
  description: String (required),
  price: Number (required, min: 0),
  category: String (required),
  image: String (required),
  brand: String,
  stock: Number (default: 0),
  rating: Number (0-5, default: 0),
  numReviews: Number (default: 0),
  weaviateId: String (unique, sparse),
  pineconeId: String (unique, sparse),
  createdAt: Date
}
```

**Important Hooks:**
- `pre('save')` / `post('save')`: Auto-syncs to Pinecone when product is created or key fields change
- `pre('findOneAndUpdate')` / `post('findOneAndUpdate')`: Auto-syncs on updates
- `post('deleteOne')` / `post('findOneAndDelete')`: Removes vector from Pinecone

#### Key API Endpoints (`backend/routes/products.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get single product |
| GET | `/api/products/:id/similar` | Get 5 similar products (vector-based) |
| POST | `/api/products/recommendations` | Get 10 recommendations from product IDs array |
| GET | `/api/products/category/:category` | Filter by category |
| PUT | `/api/products/:id/rating` | Update product rating |

**Recommendation Strategy** (`backend/routes/products.js:218-332`):
1. **Primary**: Query Pinecone using product vector (cosine similarity)
2. **Fallback**: Heuristic scoring based on:
   - Category match (+3 points)
   - Brand match (+2 points)
   - Name similarity (Jaccard, +3 points)
   - Description similarity (Jaccard, +1 point)
   - Price affinity (+2 points)

### 2. Vector Database Integration

#### Pinecone Setup (`backend/pineconeClient.js`)
- **Index**: 768-dimensional vectors (Google `text-embedding-004`)
- **Operations**:
  - `upsertVector(id, vector, metadata)`: Add/update product vector
  - `deleteVector(id)`: Remove product vector
  - `queryById(id, topK)`: Find similar products by ID
  - `queryByVector(vector, topK)`: Find similar products by embedding
  - `fetchVectors(ids)`: Bulk retrieve vectors

**Sync Process** (`backend/services/pineconeSync.js`):
1. Generate text: `${name} ${description} ${category} ${brand}`
2. Embed text using Google Generative AI
3. Upsert to Pinecone with metadata (mongoId, category, brand, price, etc.)
4. Store `pineconeId` in MongoDB

#### Auto-Sync Triggers
- **On server start**: `backend/index.js:36` - syncs all products
- **On product save**: `backend/models/product.js:68-78`
- **On product update**: `backend/models/product.js:88-98`
- **On product delete**: `backend/models/product.js:100-117`

### 3. Search Functionality

#### Search Endpoint (`backend/routes/search.js`)
```
GET /api/search?q=<query>
```
- Case-insensitive regex search on `name` and `description`
- Returns all matching products (no pagination currently)

**Enhancement Opportunity**: Integrate vector search for semantic matching.

### 4. Checkout Process

#### Checkout Validation (`backend/routes/checkout.js`)
```
POST /api/checkout/create-order
{
  items: [{ productId, quantity }],
  name: string,
  email: string,
  shippingAddress: string,
  cardNumber: string (16 digits),
  cardName: string,
  expiry: string (MM/YY),
  cvc: string (3-4 digits)
}
```
- Validates email format, card number (16 digits), expiry (MM/YY), CVC (3-4 digits)
- Simulates 3-second processing delay
- Returns `{ message: 'Order created successfully!' }`
- **Note**: No persistent order storage or payment gateway integration (demo only)

### 5. Authentication System

#### User Model (`backend/models/user.js`)
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, bcrypt hashed),
  createdAt: Date
}
```

#### Auth Endpoints (`backend/routes/auth.js`)
- `POST /api/auth/register`: Create user account
- `POST /api/auth/login`: Authenticate and receive JWT
- `POST /api/auth/forgot-password`: Initiate password reset
- `POST /api/auth/reset-password`: Complete password reset
- Middleware: JWT verification for protected routes

### 6. Frontend Architecture

#### Routing (`src/App.jsx`)
```
/ → Home (featured products + recommendations)
/shop → All products grid
/product/:id → Product details + similar items
/cart → Shopping cart
/checkout → Checkout form
/order-success → Confirmation page
/login, /register, /forgot-password, /reset-password → Auth flows
/about, /support → Info pages
* → 404 Not Found
```

#### State Management
- **Global**: Cart state via React Context (`App.jsx`)
- **Notifications**: `NotificationProvider.jsx` for toast messages
- **Local Storage**: Cart persists across sessions (`fusionCart` key)

#### API Client (`src/services/apiClient.js`)
- Axios instance with base URL configuration
- `withRetry()` wrapper for exponential backoff (3 attempts)
- Error handling with user-friendly messages

#### Key Components
- **`NavigationBar.jsx`**: Top bar with logo, search, cart badge
- **`ProductCard.jsx`**: Product tile with image, price, rating, "Add to Cart" button
- **`CheckoutForm.jsx`**: Payment form with react-credit-cards-2 visualization
- **`ScrollToTop.jsx`**: Scrolls to top on route change (via `useLocation` hook)
- **`SearchResults.jsx`**: Displays filtered products

---

## Testing Strategy

### Backend Tests (`backend/__tests__/`)
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Test Files**:
- `auth.spec.js`: User registration, login, JWT validation
- `checkout.spec.js`: Order creation, validation errors
- `search.spec.js`: Product search queries

**Framework**: Jest + Supertest
**Best Practices**:
- Use `beforeAll` to connect to test DB
- Use `afterAll` to disconnect and clean up
- Mock external services (Pinecone, Google AI) when necessary

### Frontend Tests (`src/tests/`)
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Test Files**:
- `Cart.test.js`, `Checkout.test.js`, `Home.test.js`, etc.

**Framework**: Jest + React Testing Library
**Best Practices**:
- Use `render()` to mount components
- Use `screen.getByRole`, `screen.getByText` for queries
- Use `fireEvent` or `userEvent` for interactions
- Mock API responses with `jest.mock`

---

## Common Agent Tasks

### Task 1: Add a New API Endpoint

**Example**: Add product reviews endpoint

1. **Update Product Model** (`backend/models/product.js`):
   ```javascript
   reviews: [{
     userId: mongoose.Schema.Types.ObjectId,
     userName: String,
     rating: Number,
     comment: String,
     createdAt: { type: Date, default: Date.now }
   }]
   ```

2. **Create Route Handler** (`backend/routes/products.js`):
   ```javascript
   router.post('/:id/reviews', async (req, res) => {
     const { rating, comment, userName } = req.body;
     const product = await Product.findById(req.params.id);
     product.reviews.push({ rating, comment, userName });
     await product.save();
     res.json(product);
   });
   ```

3. **Add Swagger Documentation**:
   ```javascript
   /**
    * @swagger
    * /api/products/{id}/reviews:
    *   post:
    *     summary: Add a review
    *     tags: [Products]
    *     ...
    */
   ```

4. **Write Tests** (`backend/__tests__/products.spec.js`):
   ```javascript
   describe('POST /api/products/:id/reviews', () => {
     it('should add a review', async () => {
       const res = await request(app)
         .post(`/api/products/${productId}/reviews`)
         .send({ rating: 5, comment: 'Great!', userName: 'John' });
       expect(res.status).toBe(200);
       expect(res.body.reviews).toHaveLength(1);
     });
   });
   ```

### Task 2: Add a New React Component

**Example**: Add product comparison feature

1. **Create Component** (`src/components/ProductComparison.jsx`):
   ```jsx
   import React from 'react';
   import { Box, Typography } from '@mui/material';

   function ProductComparison({ products }) {
     return (
       <Box>
         {products.map(p => <Typography key={p.id}>{p.name}</Typography>)}
       </Box>
     );
   }
   export default ProductComparison;
   ```

2. **Import in Parent** (`src/pages/Shop.jsx`):
   ```jsx
   import ProductComparison from '../components/ProductComparison';
   ```

3. **Add Route** (if needed in `src/App.jsx`):
   ```jsx
   <Route path="/compare" element={<ProductComparison products={selectedProducts} />} />
   ```

4. **Write Tests** (`src/tests/ProductComparison.test.js`):
   ```javascript
   import { render, screen } from '@testing-library/react';
   import ProductComparison from '../components/ProductComparison';

   test('renders product names', () => {
     const products = [{ id: '1', name: 'Laptop' }];
     render(<ProductComparison products={products} />);
     expect(screen.getByText('Laptop')).toBeInTheDocument();
   });
   ```

### Task 3: Integrate a New Vector Database

**Example**: Add Qdrant support

1. **Install SDK**:
   ```bash
   cd backend && npm install @qdrant/js-client-rest
   ```

2. **Create Client** (`backend/qdrantClient.js`):
   ```javascript
   const { QdrantClient } = require('@qdrant/js-client-rest');
   const client = new QdrantClient({ url: process.env.QDRANT_URL });
   module.exports = { client };
   ```

3. **Add Sync Service** (`backend/services/qdrantSync.js`):
   ```javascript
   async function ensureProductSyncedWithQdrant(product) {
     // Generate embedding
     // Upsert to Qdrant
   }
   module.exports = { ensureProductSyncedWithQdrant };
   ```

4. **Update Product Hooks** (`backend/models/product.js`):
   ```javascript
   const { ensureProductSyncedWithQdrant } = require('../services/qdrantSync');
   productSchema.post('save', function(doc, next) {
     ensureProductSyncedWithQdrant(doc).catch(console.error).finally(next);
   });
   ```

5. **Update `.env`**:
   ```env
   QDRANT_URL=http://localhost:6333
   QDRANT_COLLECTION=products
   ```

### Task 4: Improve Search with Semantic Vector Search

**Current**: Regex-based text search (`backend/routes/search.js`)

**Enhancement**:
1. **Embed Query** using Google Generative AI
2. **Query Pinecone** with query vector
3. **Return Top K Products** ranked by cosine similarity

**Implementation** (`backend/routes/search.js`):
```javascript
const { embedText } = require('../services/embeddingService');
const { queryByVector } = require('../pineconeClient');

router.get('/', async (req, res) => {
  const query = req.query.q;

  // Fallback to regex if no query
  if (!query || query.trim().length === 0) {
    return res.json(await Product.find().limit(50));
  }

  try {
    // Generate embedding for search query
    const vector = await embedText(query);

    // Query Pinecone
    const { matches } = await queryByVector(vector, 20);

    // Load products from MongoDB
    const mongoIds = matches.map(m => m.metadata.mongoId).filter(Boolean);
    const products = await Product.find({ _id: { $in: mongoIds } });

    // Return products in relevance order
    const idToProduct = new Map(products.map(p => [p._id.toString(), p]));
    const sortedProducts = mongoIds
      .map(id => idToProduct.get(id))
      .filter(Boolean);

    res.json(sortedProducts);
  } catch (error) {
    console.error('Vector search failed, falling back to regex:', error);

    // Fallback to regex search
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(products);
  }
});
```

### Task 5: Add Pagination to Product Lists

**Backend** (`backend/routes/products.js`):
```javascript
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find().skip(skip).limit(limit).lean(),
    Product.countDocuments()
  ]);

  res.json({
    products: products.map(p => ({ ...p, id: p._id })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
```

**Frontend** (`src/pages/Shop.jsx`):
```jsx
const [page, setPage] = useState(1);

useEffect(() => {
  axios.get(`/api/products?page=${page}&limit=20`)
    .then(res => {
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    });
}, [page]);

return (
  <>
    <Grid container spacing={2}>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </Grid>
    <Pagination
      count={pagination.pages}
      page={page}
      onChange={(e, val) => setPage(val)}
    />
  </>
);
```

---

## Environment Variables Reference

### Required Variables
```env
MONGO_URI=mongodb://localhost:27017/Ecommerce-Products
JWT_SECRET=your_secret_key
PINECONE_API_KEY=pk-xxx
PINECONE_HOST=https://xxx.pinecone.io
PINECONE_INDEX=ecommerce-products
GOOGLE_AI_API_KEY=AIzaSy...
```

### Optional Variables
```env
PORT=5000
PINECONE_NAMESPACE=ecommerce-products
PINECONE_PURGE_ON_SYNC=true
WEAVIATE_HOST=https://xxx.weaviate.network
WEAVIATE_API_KEY=xxx
RECOMMENDATION_PREFER_WEAVIATE=false
```

---

## Critical Code Paths

### 1. Product Recommendation Flow
```
User visits /product/:id
  → Frontend fetches product details (GET /api/products/:id)
  → Frontend fetches similar products (GET /api/products/:id/similar)
    → Backend queries Pinecone by product ID
    → Returns top 5 similar products
  → If Pinecone fails, fallback to heuristic scoring
  → Frontend displays recommendations
```

### 2. Cart to Checkout Flow
```
User adds products to cart
  → Cart state stored in React Context + localStorage
User clicks "Proceed to Checkout"
  → Navigate to /checkout
User fills payment form
  → POST /api/checkout/create-order
  → Backend validates inputs
  → Returns success message
  → Frontend navigates to /order-success
  → Cart cleared
```

### 3. Vector Sync Flow
```
Product created/updated in MongoDB
  → Mongoose post-save hook triggered
  → Extract text (name + description + category + brand)
  → Generate embedding via Google Generative AI
  → Upsert vector to Pinecone with metadata
  → Store pineconeId in MongoDB
```

---

## Performance Considerations

1. **Vector Search Latency**: Pinecone queries typically <100ms, but can timeout. Always implement fallbacks.
2. **Embedding Generation**: Google AI API rate limits apply. Cache embeddings when possible.
3. **MongoDB Queries**: Index frequently queried fields (`category`, `brand`, `name`, `_id`).
4. **Frontend Rendering**: Use `React.memo` for `ProductCard` to prevent unnecessary re-renders.
5. **Image Loading**: Consider lazy loading for product images.

---

## Security Best Practices

1. **JWT Secret**: Use strong, random secrets in production
2. **Password Hashing**: Already implemented with bcryptjs (10 rounds)
3. **Input Validation**: Add express-validator for all endpoints
4. **Rate Limiting**: Implement rate limiting on auth and checkout endpoints
5. **CORS**: Configure allowed origins in production
6. **Environment Variables**: Never commit `.env` files
7. **SQL Injection**: MongoDB is immune, but always sanitize inputs
8. **XSS**: React escapes by default, but validate user-generated content

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (`npm test` in root and backend)
- [ ] Environment variables configured on hosting platform
- [ ] MongoDB connection string points to production database
- [ ] Pinecone index provisioned and synced
- [ ] CORS origins updated for production URLs
- [ ] Build frontend (`npm run build`)
- [ ] Test production build locally

### Deployment Steps
1. **Backend (Render/Vercel)**:
   - Set environment variables
   - Deploy from `backend/` directory
   - Set start command: `node index.js`
   - Test API health: `GET /api/products`

2. **Frontend (Vercel)**:
   - Link GitHub repository
   - Set build command: `npm run build`
   - Set output directory: `build`
   - Configure API proxy if needed

3. **Vector Database**:
   - Ensure Pinecone serverless index is active
   - Run sync after deployment: `npm run sync-pinecone`

4. **Post-Deployment**:
   - Test critical flows (browse → add to cart → checkout)
   - Monitor error logs
   - Set up uptime monitoring (e.g., UptimeRobot)

---

## Troubleshooting Guide

### Issue: Pinecone sync fails with "Namespace not found"
**Solution**: Set `PINECONE_NAMESPACE` in `.env` or remove namespace parameter in `pineconeClient.js`

### Issue: Frontend shows "Network Error" on API calls
**Solution**:
1. Check `setupProxy.js` proxy configuration
2. Verify backend is running on correct port
3. Check CORS settings in `backend/index.js`

### Issue: Product recommendations return empty array
**Solution**:
1. Verify Pinecone index has vectors: `npm run sync-pinecone`
2. Check `pineconeId` field is populated in MongoDB
3. Review logs for embedding API errors

### Issue: Tests fail with "Cannot find module"
**Solution**:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Check `jest.config.js` for module path configuration

### Issue: Docker build fails
**Solution**:
1. Check `.dockerignore` excludes `node_modules`
2. Verify `Dockerfile` uses correct Node version
3. Test build locally: `docker build -t fusion-app .`

---

## Contribution Guidelines

### Code Style
- **JavaScript**: Use ES6+ syntax, async/await preferred over callbacks
- **React**: Functional components with Hooks (no class components)
- **Indentation**: 2 spaces
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Comments**: JSDoc for functions, inline comments for complex logic

### Git Workflow
1. Create feature branch: `git checkout -b feat/new-feature`
2. Make changes and commit: `git commit -m "feat: add new feature"`
3. Push and open PR: `git push origin feat/new-feature`
4. Wait for CI checks to pass
5. Request review from maintainers
6. Merge after approval

### Commit Message Format
```
<type>: <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example**:
```
feat: add semantic search to product search

- Integrate Pinecone vector search for query embedding
- Fallback to regex search on failure
- Add embedText service for query vectorization

Closes #42
```

---

## Advanced Topics

### Custom Vector Embeddings
If you want to use a different embedding model (e.g., OpenAI, Cohere, Sentence Transformers):

1. Install SDK: `npm install @openai/api` (example)
2. Create embedding service: `backend/services/embeddingService.js`
3. Update Pinecone dimension if needed (e.g., OpenAI ada-002 = 1536 dims)
4. Replace Google AI calls with new service

### Hybrid Search (Keyword + Vector)
Combine MongoDB text search with Pinecone vector search:

```javascript
// 1. Get keyword matches from MongoDB
const keywordMatches = await Product.find({
  $text: { $search: query }
}, {
  score: { $meta: 'textScore' }
}).sort({ score: -1 }).limit(10);

// 2. Get vector matches from Pinecone
const vectorMatches = await queryByVector(queryEmbedding, 10);

// 3. Merge and re-rank
const combined = mergeAndRank(keywordMatches, vectorMatches);
```

### Multi-Tenancy
To support multiple stores in one deployment:

1. Add `storeId` field to Product model
2. Add middleware to extract store from subdomain/header
3. Filter all queries by `storeId`
4. Use Pinecone namespaces per store

---

## AI Agent Specific Instructions

### When Adding Features
1. **Read existing code first**: Use Read tool on relevant files
2. **Follow established patterns**: Match naming conventions, error handling, and structure
3. **Update tests**: Always add/update tests for new features
4. **Document changes**: Update inline comments and this AGENTS.md if needed
5. **Check dependencies**: Verify no breaking changes to existing functionality

### When Debugging
1. **Check logs first**: Review console output for errors
2. **Isolate the issue**: Test API endpoints with Postman/curl before blaming frontend
3. **Verify environment**: Ensure `.env` variables are set correctly
4. **Test incrementally**: Make small changes and test after each step
5. **Use debugging tools**: `console.log`, debugger, React DevTools, MongoDB Compass

### When Refactoring
1. **Run tests before and after**: Ensure no regressions
2. **Refactor in small chunks**: Don't change everything at once
3. **Preserve API contracts**: Don't break existing endpoints without versioning
4. **Update documentation**: Reflect changes in comments and docs

### Best Practices for AI Agents
- **Be explicit**: Don't assume implicit behavior—check the code
- **Preserve intent**: Understand why code exists before changing it
- **Ask for clarification**: If requirements are ambiguous, request user input
- **Provide alternatives**: Suggest multiple solutions with trade-offs
- **Think holistically**: Consider frontend, backend, database, and vector DB interactions

---

## Quick Reference Commands

### Development
```bash
# Start everything
npm run dev                    # Runs both frontend and backend concurrently

# Backend only
cd backend && npm start

# Frontend only
npm start

# Database seeding
cd backend/seed && node productSeeds.js dev

# Vector DB sync
cd backend
npm run sync-pinecone
npm run weaviate-upsert
npm run sync-weaviate
```

### Testing
```bash
# All tests
npm test                       # Frontend
cd backend && npm test         # Backend

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Building
```bash
# Frontend production build
npm run build

# Docker build
docker compose up --build
```

### Deployment
```bash
# Push to GitHub (triggers CI/CD)
git push origin main

# Manual deploy to Vercel
vercel --prod
```

---

## Additional Resources

- **MongoDB Docs**: https://www.mongodb.com/docs/
- **Express.js Guide**: https://expressjs.com/en/guide/routing.html
- **React Docs**: https://react.dev/
- **Material-UI**: https://mui.com/material-ui/getting-started/
- **Pinecone Docs**: https://docs.pinecone.io/
- **Weaviate Docs**: https://weaviate.io/developers/weaviate
- **Jest Docs**: https://jestjs.io/docs/getting-started
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **Swagger/OpenAPI**: https://swagger.io/specification/

---

## Support and Contact

For issues, questions, or contributions:
- **GitHub Issues**: https://github.com/hoangsonww/MERN-Stack-Ecommerce-App/issues
- **Email**: hoangson091104@gmail.com
- **Author**: Son Nguyen (@hoangsonww)

---

**Last Updated**: 2025-10-04
**Version**: 1.1.0
**Maintained by**: Fusion Electronics Team
