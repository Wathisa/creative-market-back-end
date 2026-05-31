import { Order } from "../orders/order.model.js";
import { User } from "../register/user.model.js";

const STATUS_LABELS = {
  pending: "รอดำเนินการ",
  paid: "สำเร็จแล้ว",
  cancelled: "ยกเลิก",
};

const flattenOrderItems = (orders) =>
  orders.flatMap((order) =>
    order.items.map((item, index) => ({
      id: `${order._id}-${item.productId}-${index}`,
      orderId: order._id,
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      lineTotal: item.price * item.quantity,
      status: order.status,
      statusLabel: STATUS_LABELS[order.status] || order.status.toUpperCase(),
      createdAt: order.createdAt,
    })),
  );

export const getDashboardMe = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId).select("username email role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username || user.email?.split("@")[0] || "Customer",
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMySummary = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const paidOrders = await Order.find({ userId, status: "paid" }).select(
      "totalPrice",
    );

    const totalSpend = paidOrders.reduce(
      (sum, order) => sum + order.totalPrice,
      0,
    );

    return res.status(200).json({
      success: true,
      data: {
        totalOrders: paidOrders.length,
        totalSpend,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyStatus = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const orders = await Order.find({ userId, status: "pending" })
      .sort({ createdAt: -1 })
      .select("items status createdAt");

    return res.status(200).json({
      success: true,
      data: flattenOrderItems(orders),
    });
  } catch (error) {
    next(error);
  }
};

export const getMyHistory = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const orders = await Order.find({ userId, status: "paid" })
      .sort({ createdAt: -1 })
      .select("items status createdAt");

    return res.status(200).json({
      success: true,
      data: flattenOrderItems(orders),
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .select("items totalPrice status createdAt");

    const paidOrders = orders.filter((order) => order.status === "paid");
    const flattenedOrders = flattenOrderItems(orders);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOrders: orders.length,
          totalSpend: paidOrders.reduce(
            (sum, order) => sum + order.totalPrice,
            0,
          ),
          completedOrders: paidOrders.length,
        },
        orders: flattenedOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};
