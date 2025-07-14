const swaggerJSDoc = require('swagger-jsdoc');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Fusion E-Commerce Backend APIs',
    version: '1.1.0',
    description:
      'API documentation for the Fusion E-Commerce backend server. This documentation provides detailed information on all available endpoints for managing products, users, authentication, and more.',
    termsOfService: 'https://mern-stack-ecommerce-app-nine.vercel.app',
    contact: {
      name: 'Fusion E-Commerce Website',
      url: 'https://mern-stack-ecommerce-app-nine.vercel.app',
      email: 'hoangson091104@gmail.com',
    },
    license: {
      name: 'MIT License',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'https://fusion-electronics-api.vercel.app',
      description: 'Production server',
    },
    {
      url: 'https://mern-stack-ecommerce-app-h5wb.onrender.com',
      description: 'Production (backup) server',
    },
    {
      url: 'http://localhost:8000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Product: {
        type: 'object',
        required: ['name', 'price', 'description', 'category'],
        properties: {
          id: { type: 'string', description: 'Product ID' },
          name: { type: 'string', description: 'Name of the product' },
          description: { type: 'string', description: 'Detailed description of the product' },
          price: { type: 'number', description: 'Price of the product in USD' },
          category: { type: 'string', description: 'Category the product belongs to' },
          brand: { type: 'string', description: 'Brand of the product' },
          stock: { type: 'integer', description: 'Stock count available' },
          rating: { type: 'number', description: 'Average rating of the product' },
          numReviews: { type: 'integer', description: 'Number of reviews for the product' },
          image: { type: 'string', description: 'URL of the product image' },
        },
        example: {
          id: '507f1f77bcf86cd799439011',
          name: 'Wireless Headphones',
          description: 'Noise-cancelling wireless headphones with long battery life.',
          price: 99.99,
          category: 'Electronics',
          brand: 'Fusion',
          stock: 150,
          rating: 4.7,
          numReviews: 89,
          image: 'https://example.com/product.jpg',
        },
      },
      User: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          id: { type: 'string', description: 'User ID' },
          name: { type: 'string', description: 'Full name of the user' },
          email: { type: 'string', description: 'Email address of the user' },
          password: { type: 'string', description: 'Password for the user account' },
          createdAt: { type: 'string', format: 'date-time', description: 'Account creation date' },
        },
        example: {
          id: '507f1f77bcf86cd799439011',
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          createdAt: '2023-10-21T14:21:00Z',
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

/**
 * Serves the raw OpenAPI JSON at /api-docs/swagger.json
 */
function setupSwaggerJson(app) {
  app.get('/api-docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

/**
 * Serves the Swagger UI HTML at /api-docs, loading assets from CDN
 */
function setupSwaggerUi(app) {
  app.get('/api-docs', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fusion E-Commerce API Docs</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Favicons -->
  <link rel="icon" href="https://unpkg.com/swagger-ui-dist/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" href="https://unpkg.com/swagger-ui-dist/favicon-16x16.png" sizes="16x16" />
  <!-- Swagger UI CSS -->
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  <style>
    body { margin:0; padding:0; font-family: Arial, sans-serif; }
    .topbar { background-color: #1976d2; }
    .swagger-ui .topbar { background-color: #1976d2; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <!-- Swagger UI JS bundles -->
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/api-docs/swagger.json',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        docExpansion: "none",
        operationsSorter: "alpha"
      });
    };
  </script>
</body>
</html>`);
  });
}

module.exports = {
  swaggerSpec,
  setupSwaggerJson,
  setupSwaggerUi,
};
