import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";

import authRoutes from "./modules/auth/auth.routes";
import clientsRoutes from "./modules/clients/clients.routes";
import documentsRoutes from "./modules/documents/documents.routes";
import itrRoutes from "./modules/itr/itr.routes";
import gstRoutes from "./modules/gst/gst.routes";
import tdsTcsRoutes from "./modules/tds-tcs/tds-tcs.routes";
import whatsappRoutes from "./modules/whatsapp/whatsapp.routes";
import billingRoutes from "./modules/billing/billing.routes";
import tasksRoutes from "./modules/tasks/tasks.routes";
import aiRoutes from "./modules/ai-assistant/ai.routes";
import adminRoutes from "./modules/admin/admin.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import healthRoutes from "./modules/health/health.routes";
import webhooksRoutes from "./modules/webhooks/webhooks.routes";

import taxAuditRoutes from "./modules/tax-audit/tax-audit.routes";
import gstRegistrationRoutes from "./modules/gst-registration/gst-registration.routes";

export const app = express();

app.use(helmet());
app.use(cors({
  origin: [config.appUrl, "http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

// Static file serving for uploaded document storage
app.use("/storage", express.static(config.storage.uploadDir));

// Health Checks
app.use("/health", healthRoutes);

// Webhooks
app.use("/webhooks", webhooksRoutes);

// Business API Routes
const apiRouter = express.Router();
apiRouter.use("/auth", authRoutes);
apiRouter.use("/clients", clientsRoutes);
apiRouter.use("/documents", documentsRoutes);
apiRouter.use("/itr", itrRoutes);
apiRouter.use("/gst", gstRoutes);
apiRouter.use("/tax-audit", taxAuditRoutes);
apiRouter.use("/gst-registration", gstRegistrationRoutes);
apiRouter.use("/tds-tcs", tdsTcsRoutes);
apiRouter.use("/whatsapp", whatsappRoutes);
apiRouter.use("/invoices", billingRoutes);
apiRouter.use("/tasks", tasksRoutes);
apiRouter.use("/ai-assistant", aiRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/dashboard", dashboardRoutes);

app.use("/api", apiRouter);
app.use("/", apiRouter);

// Global Error Handler
app.use(errorHandler);
