import express from "express";
import {
  login,
  initiateRegistration,
  verifyOtp,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", initiateRegistration);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);

export default router;
