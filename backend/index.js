require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const seedDB = require('./seed/productSeeds');
const syncWeaviate = require('./sync/syncWeaviate');
const productRoutes = require('./routes/products');
const checkoutRoutes = require('./routes/checkout');
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const { setupSwaggerUi, setupSwaggerJson } = require('./docs/swagger');

// Validate required environment variables
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
requiredEnv.forEach(key => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
});

// Create Express App
const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.disable('x-powered-by');
app.use(helmet());

const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || [],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(xss());

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, try again later.',
});
app.use('/api/auth', authLimiter, authRoutes);

// Routes
app.use('/api/products', productRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/search', searchRoutes);

// Swagger docs (disable in production unless needed)
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => res.redirect('/api-docs'));
  setupSwaggerJson(app);
  setupSwaggerUi(app);
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong' });
});

// Database Connection + Optional Seed + Sync + Server Start
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('✅ MongoDB Connected');

    if (process.env.NODE_ENV === 'development') {
      try {
        await seedDB();
        console.log('🪴 Database seeded');
      } catch (err) {
        console.error('❌ Seeding error:', err);
      }
    }

    try {
      await syncWeaviate();
      console.log('✅ Weaviate synced');
    } catch (err) {
      console.error('❌ Weaviate sync error:', err);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server ready on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
