import express from "express";
import {
  getAssignedComplaints,
  updateComplaintStatus,
  addComplaintNote,
} from "../controllers/staffController.js";
import staffAuth from "../middleware/staffAuthMiddleware.js";

const router = express.Router();

router.get("/complaints", staffAuth, getAssignedComplaints);
router.put("/complaints/:id/status", staffAuth, updateComplaintStatus);
router.post("/complaints/:id/notes", staffAuth, addComplaintNote);

export default router;
