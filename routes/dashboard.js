import express from "express";
import { getDashboardStats } from "../controllers/dashboard.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.get("/stats", auth(["admin"]), getDashboardStats);

export default router;
