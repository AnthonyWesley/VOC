import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

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
import { swaggerSpec } from "./shared/swagger";

const app = express();

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

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
    ],
    credentials: true,
  }),
);

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

app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (_, res) => res.json(swaggerSpec));

app.use(ErrorHandler);

export { app };
