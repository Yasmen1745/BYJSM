import User from "../models/user.js";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Book from "../models/book.js";

// Create user
export const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).json({ errors: "Email is taken" });

  try {
    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create new user with hashed password
    const newUser = new User({
      ...req.body,
      password: hashedPassword,
    });

    await newUser.save();
    const { password, ...userData } = newUser.toObject();
    res.status(201).json(userData);
  } catch (err) {
    res.status(500).json({ errors: err.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(401).json({ errors: "Invalid email or password" });

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ errors: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h", // Extended to 24 hours for admin sessions
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.json({ message: "Logged in successfully", role: user.role });
  } catch (err) {
    console.log(err);
    res.status(500).json({ errors: err.message });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Generate new token
    const newToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.cookie("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.json({ message: "Token refreshed successfully", role: user.role });
  } catch (err) {
    console.log("Token refresh error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

// Get single user
export const getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

// Update user
export const updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User deleted" });
};

export const addToCart = async (req, res) => {
  try {
    let { bookId, quantity } = req.body;

    // Validate input
    if (!bookId) {
      return res.status(400).json({ error: "bookId is required" });
    }

    quantity = parseInt(quantity, 10) || 1;
    if (quantity <= 0) {
      return res
        .status(400)
        .json({ error: "Quantity must be a positive number" });
    }

    const user = req.user;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ error: "Book not found" });

    // Check if the book is already in the cart
    const existingItem = user.cart.items.find((item) =>
      item.book.equals(bookId)
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = book.price * existingItem.quantity; // Update price according to quantity
    } else {
      user.cart.items.push({
        book: bookId,
        quantity,
        price: book.price * quantity,
      });
    }

    // Recalculate total price accurately
    user.cart.totalPrice = user.cart.items.reduce(
      (sum, item) => sum + item.price,
      0
    );

    await user.save();

    res.status(200).json({
      message: "Item added to cart successfully",
      cart: user.cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { btn_type } = req.body;

    const user = req.user;

    const itemIndex = user.cart.items.findIndex((item) =>
      item.book.equals(bookId)
    );

    if (itemIndex === -1)
      return res.status(404).json({ error: "Item not found in cart" });

    const item = user.cart.items[itemIndex];

    if (btn_type === "plus") {
      item.quantity += 1;
      item.price = (item.price / (item.quantity - 1)) * item.quantity;
    } else if (btn_type === "minus") {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        user.cart.items.splice(itemIndex, 1);
      } else {
        item.price = (item.price / (item.quantity + 1)) * item.quantity;
      }
    } else {
      return res.status(400).json({ error: "Invalid btn_type value" });
    }

    user.cart.totalPrice = user.cart.items.reduce(
      (total, item) => total + item.price,
      0
    );

    await user.save();

    res.status(200).json({ message: "Cart item updated", cart: user.cart });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating cart", error: err.message });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const { bookId } = req.params;
    const user = req.user;

    // Check if book already exists in wishlist
    if (user.wishlist.items.includes(bookId)) {
      return res.status(400).json({ error: "Book already in wishlist" });
    }

    // Add book to wishlist
    user.wishlist.items.push(bookId);
    await user.save();

    res
      .status(200)
      .json({ message: "Book added to wishlist", wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { bookId } = req.params;
    const user = req.user;

    // Find index of book in wishlist
    const bookIndex = user.wishlist.items.indexOf(bookId);

    if (bookIndex === -1) {
      return res.status(404).json({ error: "Book not found in wishlist" });
    }

    // Remove book from wishlist
    user.wishlist.items.splice(bookIndex, 1);
    await user.save();

    res
      .status(200)
      .json({ message: "Book removed from wishlist", wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
