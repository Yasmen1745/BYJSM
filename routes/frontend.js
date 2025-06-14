import express from "express";
import Book from "../models/book.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Order from "../models/order.js";
import auth from "../middlewares/auth.js";

const router = express.Router();
// Middleware to check for user from JWT
router.use(async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.locals.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate("cart.items.book");

    res.locals.user = user || null;
    next();
  } catch (error) {
    console.error("JWT middleware error:", error);
    res.locals.user = null;
    return next();
  }
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBooks = await Book.countDocuments();
    const totalPages = Math.ceil(totalBooks / limit);

    // Get user's cart and wishlist book IDs if user is logged in
    let cartBookIds = [];
    let wishlistBookIds = [];
    
    if (res.locals.user) {
      cartBookIds = res.locals.user.cart.items.map(item => item.book.toString());
      wishlistBookIds = res.locals.user.wishlist.items.map(id => id.toString());
    }

    res.render("index", {
      books,
      currentPage: page,
      totalPages,
      user: res.locals.user,
      cartBookIds,
      wishlistBookIds
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).send("Server error");
  }
});

router.get("/profile", auth(["user"]), async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.book")
      .sort({ createdAt: -1 });

    // Populate wishlist items
    await req.user.populate("wishlist.items");
    
    res.render("profile", { 
      user: req.user, 
      orders,
      wishlist: req.user.wishlist.items 
    });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    res.status(500).send("Server error");
  }
});

router.get("/checkout", auth(["user"]), async (req, res) => {
  try {
    // Populate cart items with book details
    await req.user.populate("cart.items.book");
    
    res.render("checkout", {
      user: req.user
    });
  } catch (error) {
    console.error("Error loading checkout page:", error);
    res.status(500).send("Server error");
  }
});

router.get("/user", async (req, res) => {
  res.redirect("/");
});

router.get("/about-us", async (req, res) => {
  res.render("about-us");
});

router.get("/contact-us", async (req, res) => {
  res.render("contact-us");
});

router.get("/admin", auth(["admin"]), async (req, res) => {
  res.render("admin", {
    users: await User.find(),
    books: await Book.find(),
    orders: await Order.find().populate("user").sort({ createdAt: -1 }),
  });
});

export default router;
