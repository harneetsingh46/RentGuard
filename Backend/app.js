import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./src/utils/swagger.js";
import userRouter from "./src/routes/user.route.js";
import propertyRouter from "./src/routes/property.route.js";
import unitRouter from "./src/routes/unit.route.js";
import tenantRouter from "./src/routes/tenant.route.js";
import authRouter from "./src/routes/auth.route.js";
import rentRouter from "./src/routes/rent.route.js";
import paymentRouter from "./src/routes/payment.route.js";
import { razorpayWebhook } from "./src/controllers/payment.controller.js";

//web-hook
app.post(
  "/payment/webhook",express.raw({ type: "application/json" }),razorpayWebhook,
);

app.use(express.json());

//config
const app = express();
dotenv.config();

//middleware
app.use(express.json());
app.use(cookieParser());

//routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/user/", userRouter);
app.use("/property/", propertyRouter);
app.use("/property/", unitRouter);
app.use("/property/", tenantRouter);
app.use("/tenant/", tenantRouter);
app.use("/auth/", authRouter);
app.use("/rent/", rentRouter);
app.use("/payment/", paymentRouter);

export default app;
