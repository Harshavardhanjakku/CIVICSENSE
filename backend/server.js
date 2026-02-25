import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv/config";
import bodyParser from "body-parser";
import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import districtRoutes from "./routes/districtRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import staffAuthRoutes from "./routes/staffAuthRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import dbConfig from "./config/db.js";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(bodyParser.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" })); // Restrict CORS in production

// MongoDB connection
await dbConfig();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/districts", districtRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/staff/auth", staffAuthRoutes);
app.use("/api/staff", staffRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
