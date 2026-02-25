import express from "express";
import {
  addStaff,
  getComplaintsByDistrict,
  assignComplaintToStaff,
  getStaffByDistrict,
} from "../controllers/adminController.js";
import adminAuth from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.post("/staff", adminAuth, addStaff);
router.get("/complaints", adminAuth, getComplaintsByDistrict);
router.put("/complaints/:id/assign", adminAuth, assignComplaintToStaff);
router.get("/staff", adminAuth, getStaffByDistrict);

export default router;
