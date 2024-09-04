const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const seedDB = require('./seed/productSeeds');
const productRoutes = require('./routes/products');
const checkoutRoutes = require('./routes/checkout');
const { swaggerUi, swaggerSpec } = require('./docs/swagger');

dotenv.config();

// Create Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Database Connection
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/search', require('./routes/search'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Seed database on startup
seedDB().then(() => {
  // Start Server after seeding
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});
