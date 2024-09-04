const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Fusion E-Commerce Backend APIs',
    version: '1.0.0',
    description: 'API documentation for the Fusion E-Commerce backend server.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
