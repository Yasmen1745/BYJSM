import express from "express";
import {
  createUser,
  loginUser,
  refreshToken,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  addToCart,
  updateCartItem,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/user.js";
import {
  createUserValidator,
  updateUserValidator,
} from "../validators/user.validator.js";

import auth from "../middlewares/auth.js";

const router = express.Router();

router.post("/cart", auth(["user"]), addToCart);
router.put("/cart/:bookId", auth(["user"]), updateCartItem);

router.post("/wishlist/:bookId", auth(["user"]), addToWishlist);
router.delete("/wishlist/:bookId", auth(["user"]), removeFromWishlist);

router.post("/signup", createUserValidator, createUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});
router.get("/", auth(["admin"]), getUsers);
router.get("/:id", auth(["admin"]), getUser);
router.put("/:id", auth(["admin"]), updateUserValidator, updateUser);
router.delete("/:id", auth(["admin"]), deleteUser);

export default router;
