require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const seedDB = require('./seed/productSeeds');
const syncWeaviate = require('./sync/syncWeaviate');
const productRoutes = require('./routes/products');
const checkoutRoutes = require('./routes/checkout');
const authRoutes = require('./routes/auth');
const { swaggerUi, swaggerSpec, setupSwaggerUi, setupSwaggerJson } = require('./docs/swagger');

// Create Express App
const app = express();
const PORT = process.env.PORT || 8000;

// Database Connection + Seed + Weaviate Sync + Server Start
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('MongoDB Connected');

    // 1. Seed the database
    try {
      await seedDB();
      console.log('🪴 Database seeded');
    } catch (err) {
      console.error('❌ Seeding error:', err);
    }

    // 2. Sync with Weaviate
    try {
      await syncWeaviate();
      console.log('✅ Weaviate synced');
    } catch (err) {
      console.error('❌ Weaviate sync error:', err);
    }

    // 3. Start Express server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server ready on port ${PORT}.`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redirect root to /api-docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Setup Swagger UI with customized title
setupSwaggerJson(app); // serves /api-docs/swagger.json
setupSwaggerUi(app);

// Routes
app.use('/api/products', productRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/search', require('./routes/search'));
app.use('/api/auth', authRoutes);

module.exports = app;
