import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Property Management API",
      version: "1.0.0",
      description: "API documentation for Property Management System",
    },
    servers: [
      {
        url: "http://localhost:2000",
      },
    ],
  },

  apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;