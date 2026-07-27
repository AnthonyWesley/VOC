import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { parseCorsOrigins, createCorsOptions } from "./shared/cors";

import { postRoutes } from "./modules/communication/infra/http/postRoutes";
import { ErrorHandler } from "./shared/middlewares/ErrorHandle";
import { financialRecordRoutes } from "./modules/communication/infra/http/financialRecordRoutes";
import { userRoutes } from "./modules/communication/infra/http/userRoutes";
import { memberRoutes } from "./modules/communication/infra/http/memberRoutes";
import { dashboardRoutes } from "./modules/communication/infra/http/dashboardRoutes";
import { eventRoutes } from "./modules/communication/infra/http/eventRoutes";
import { roleRoutes } from "./modules/communication/infra/http/roleRoutes";
import { ministryRoutes } from "./modules/communication/infra/http/ministryRoutes";
import { categoryRoutes } from "./modules/communication/infra/http/categoryRoute";
import { siteContentRoutes } from "./modules/communication/infra/http/siteContentRoutes";
import { notificationRoutes } from "./modules/communication/infra/http/notificationRoutes";
import { whatsappRoutes } from "./modules/communication/infra/http/whatsappRoutes";
import { postcodeRoutes } from "./modules/membership/infra/http/postcodeRoutes";
import { adminRoutes } from "./modules/communication/infra/http/adminRoutes";
import { swaggerSpec } from "./shared/swagger";
import { requestIdMiddleware } from "./shared/logger/requestIdMiddleware";
import { httpLoggerMiddleware } from "./shared/logger/httpLoggerMiddleware";
import { HealthController } from "./shared/health/healthController";
import { createHealthRoutes } from "./shared/health/healthRoutes";
import { prisma } from "./package/prisma";

const app = express();

app.use(requestIdMiddleware);
app.use(httpLoggerMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "http://localhost:5174",
          "https://api.postcodes.io",
        ],
        frameSrc: ["'self'", "https://www.youtube.com"],
      },
    },
  }),
);

const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
app.use(cors(createCorsOptions(corsOrigins)));

app.use("/users", userRoutes);
app.use("/roles", roleRoutes);
app.use("/members", memberRoutes);
app.use("/ministries", ministryRoutes);
app.use("/events", eventRoutes);
app.use("/categories", categoryRoutes);
app.use("/financial-records", financialRecordRoutes);
app.use("/posts", postRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/site-content", siteContentRoutes);
app.use("/notifications", notificationRoutes);
app.use("/whatsapp", whatsappRoutes);
app.use("/postcode", postcodeRoutes);
app.use("/admin", adminRoutes);

const healthController = new HealthController(
  prisma,
  () => !!process.env.EVOLUTION_URL,
);
const healthRoutes = createHealthRoutes(healthController);
app.use("/health", healthRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (_, res) => res.json(swaggerSpec));

app.use(ErrorHandler);

export { app };
