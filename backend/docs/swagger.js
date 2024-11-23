const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Fusion E-Commerce Backend APIs', // API title
    version: '1.1.0', // API version
    description:
      'API documentation for the Fusion E-Commerce backend server. This documentation provides detailed information on all available endpoints for managing products, users, authentication, and more.',
    termsOfService: 'https://mern-stack-ecommerce-app-nine.vercel.app',
    contact: {
      name: 'Fusion E-Commerce Website',
      url: 'https://mern-stack-ecommerce-app-nine.vercel.app',
      email: 'hoangson091104@gmail.com', // Contact email
    },
    license: {
      name: 'MIT License',
      url: 'https://opensource.org/licenses/MIT', // License link
    },
  },
  servers: [
    {
      url: 'https://mern-stack-ecommerce-app-h5wb.onrender.com',
      description: 'Production server',
    },
    {
      url: 'http://localhost:8000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Product: {
        type: 'object',
        required: ['name', 'price', 'description', 'category'],
        properties: {
          id: {
            type: 'string',
            description: 'Product ID',
          },
          name: {
            type: 'string',
            description: 'Name of the product',
          },
          description: {
            type: 'string',
            description: 'Detailed description of the product',
          },
          price: {
            type: 'number',
            description: 'Price of the product in USD',
          },
          category: {
            type: 'string',
            description: 'Category the product belongs to',
          },
          brand: {
            type: 'string',
            description: 'Brand of the product',
          },
          stock: {
            type: 'integer',
            description: 'Stock count available',
          },
          rating: {
            type: 'number',
            description: 'Average rating of the product',
          },
          numReviews: {
            type: 'integer',
            description: 'Number of reviews for the product',
          },
          image: {
            type: 'string',
            description: 'URL of the product image',
          },
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
          id: {
            type: 'string',
            description: 'User ID',
          },
          name: {
            type: 'string',
            description: 'Full name of the user',
          },
          email: {
            type: 'string',
            description: 'Email address of the user',
          },
          password: {
            type: 'string',
            description: 'Password for the user account',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation date',
          },
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
  security: [
    {
      BearerAuth: [],
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Specify the path to API files with JSDoc comments
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

const setupSwaggerUi = app => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Fusion E-Commerce API Docs',
    })
  );
};

module.exports = {
  swaggerUi,
  swaggerSpec,
  setupSwaggerUi,
};
