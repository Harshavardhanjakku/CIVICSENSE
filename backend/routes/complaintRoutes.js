import express from "express";
import {
  submitComplaint,
  getUserComplaints,
  getComplaintById,
} from "../controllers/complaintController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// submit a complaint
router.post("/", authMiddleware, submitComplaint);

// get all complaints of the logged-in user
router.get("/", authMiddleware, getUserComplaints);

// get details of a single complaint
router.get("/:id", authMiddleware, getComplaintById);

export default router;
