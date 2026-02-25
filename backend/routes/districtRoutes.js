import express from "express";
import { getDistricts } from "../controllers/districtController.js";

const router = express.Router();

router.get("/", getDistricts);

export default router;

