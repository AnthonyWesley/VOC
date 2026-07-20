import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "VOC Church API",
      version: "1.0.0",
      description: "API do sistema de gestão de igrejas VOC Church",
    },
    servers: [
      {
        url: "http://localhost:3333",
        description: "Desenvolvimento",
      },
    ],
  },
  apis: ["./src/modules/**/infra/http/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
