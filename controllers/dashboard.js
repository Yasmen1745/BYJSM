import User from "../models/user.js";
import Book from "../models/book.js";
import Order from "../models/order.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Get basic counts
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ["shipped", "delivered"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Get monthly data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          orderCount: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Format monthly data
    const monthlyLabels = [];
    const monthlyOrderData = [];
    const monthlyRevenueData = [];

    // Create labels for last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      monthlyLabels.push(`${monthName} ${year}`);
      
      // Find data for this month
      const monthData = monthlyOrders.find(item => 
        item._id.year === year && item._id.month === (date.getMonth() + 1)
      );
      
      monthlyOrderData.push(monthData ? monthData.orderCount : 0);
      monthlyRevenueData.push(monthData ? monthData.revenue : 0);
    }

    // Get category distribution
    const categoryData = await Book.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const categoryLabels = categoryData.map(item => item._id);
    const categoryValues = categoryData.map(item => item.count);

    res.json({
      totalUsers,
      totalBooks,
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      monthlyData: {
        labels: monthlyLabels,
        orders: monthlyOrderData,
        revenue: monthlyRevenueData
      },
      categoryData: {
        labels: categoryLabels,
        values: categoryValues
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard statistics" });
  }
};
