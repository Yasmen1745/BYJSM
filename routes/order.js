import express from "express";
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/order.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post("/", auth(["user"]), createOrder);
router.get("/", auth(["admin"]), getOrders);
router.get("/:id", auth(["admin"]), getOrder);
router.put("/:id/status", auth(["admin"]), updateOrderStatus);
router.delete("/:id", auth(["admin"]), deleteOrder);

export default router;
