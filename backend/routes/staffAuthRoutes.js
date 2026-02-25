import express from "express";
import { loginStaff } from "../controllers/staffAuthController.js";

const router = express.Router();

router.post("/login", loginStaff);

export default router;
