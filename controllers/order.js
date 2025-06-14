import Order from "../models/order.js";
import Book from "../models/book.js";

export const createOrder = async (req, res) => {
  try {
    // Get user from req.user (set by auth middleware)
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get cart from user
    await user.populate("cart.items.book");
    const cartItems = user.cart.items;
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Prepare order items
    const orderItems = cartItems.map((item) => ({
      book: item.book._id,
      quantity: item.quantity,
    }));
    const totalAmount = user.cart.totalPrice;

    // Check stock for each book
    for (const item of cartItems) {
      if (item.book.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${item.book.title}`,
        });
      }
    }

    // Deduct stock
    for (const item of cartItems) {
      await Book.findByIdAndUpdate(item.book._id, {
        $inc: { stock: -item.quantity },
      });
    }

    // Create order
    const order = await Order.create({
      user: user._id,
      items: orderItems,
      totalAmount,
      status: "pending",
    });

    // Clear user's cart
    user.cart.items = [];
    user.cart.totalPrice = 0;
    await user.save();

    res
      .status(201)
      .json({ message: "Order placed successfully", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOrders = async (req, res) => {
  const orders = await Order.find().populate("user").populate("items.book");
  res.json(orders);
};

export const getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user")
    .populate("items.book");
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
};

export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending", "shipped", "delivered"];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: "Invalid status" });

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
};

export const deleteOrder = async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ message: "Order deleted" });
};
