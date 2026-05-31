import { Order } from "../orders/order.model.js";
import { User } from "../register/user.model.js";
import { Address } from "../address/address.model.js";

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

export const getMyAddress = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const addressDocument = await Address.findOne({ userId }).select("address");

    return res.status(200).json({
      success: true,
      data: addressDocument ? addressDocument.address : null,
    });
  } catch (error) {
    next(error);
  }
};

export const upsertMyAddress = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { recipientName, phone, street, district, province, postcode } =
      req.body;

    const requiredFields = {
      recipientName,
      phone,
      street,
      province,
      postcode,
    };

    const missingField = Object.entries(requiredFields).find(
      ([, value]) => !String(value || "").trim(),
    );

    if (missingField) {
      return res.status(400).json({
        success: false,
        message: `${missingField[0]} is required`,
      });
    }

    const address = {
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      district: String(district || "").trim(),
      province: province.trim(),
      postcode: postcode.trim(),
    };

    const addressDocument = await Address.findOneAndUpdate(
      { userId },
      { userId, address },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).select("address");

    return res.status(200).json({
      success: true,
      message: "Address saved successfully",
      data: addressDocument.address,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMyAddress = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    await Address.findOneAndDelete({ userId });

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
