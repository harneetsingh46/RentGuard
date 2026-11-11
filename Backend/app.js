import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./src/utils/swagger.js";
import userRouter from "./src/routes/user.route.js";
import propertyRouter from "./src/routes/property.route.js";
import unitRouter from "./src/routes/unit.route.js";
import tenantRouter from "./src/routes/tenant.route.js";
import authRouter from "./src/routes/auth.route.js";
import billRouter from "./src/routes/bill.route.js";
import paymentRouter from "./src/routes/payment.route.js";
import dashboardRouter from "./src/routes/dashboard.route.js";
import documentRouter from "./src/routes/propertyDocument.routes.js";
import orderRouter from "./src/routes/order.route.js";
import maintenanceRouter from "./src/routes/maintenance.route.js";
import contactRouter from "./src/routes/contact.route.js";
// import { razorpayWebhook } from "./src/controllers/payment.controller.js";

//config
const app = express();
dotenv.config();

// Behind a proxy (Render, Heroku, Nginx) set TRUST_PROXY=1 so rate limits see real client IPs
if (process.env.TRUST_PROXY) {
  const trustProxy = process.env.TRUST_PROXY.trim();
  const num = Number(trustProxy);
  app.set(
    "trust proxy",
    !isNaN(num) ? num : trustProxy.toLowerCase() === "true" ? true : trustProxy,
  );
}

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "https://rent-guard-1.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

//web-hook
// app.post(
//   "/payment/webhook",
//   express.raw({ type: "application/json" }),
//   razorpayWebhook,
// );

// Backend health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RentGuard backend is running!",
    status: " healthy",
  });
});

//routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/user/", userRouter);
app.use("/property/", propertyRouter);
app.use("/property/", unitRouter);
app.use("/property/", tenantRouter);
app.use("/tenant/", tenantRouter);
app.use("/auth/", authRouter);
app.use("/bill/", billRouter);
app.use("/payment/", paymentRouter);
app.use("/dashboard/", dashboardRouter);
app.use("/document/", documentRouter);
app.use("/order", orderRouter);
app.use("/maintenance/", maintenanceRouter);
app.use("/contact/", contactRouter);

export default app;
