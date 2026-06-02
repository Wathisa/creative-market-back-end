import { Order } from "../orders/order.model.js";
import { User } from "../register/user.model.js";
import { Address } from "../address/address.model.js";

const STATUS_LABELS = {
  pending: "รอดำเนินการ",
  paid: "สำเร็จแล้ว",
  cancelled: "ยกเลิก",
};

const flattenOrderItems = (
  orders, //แปลง orders หลายใบให้เป็น list แบนของ item แต่ละชิ้น
) =>
  orders.flatMap((order) =>
    order.items.map((item, index) => ({
      id: `${order._id}-${item.productId}-${index}`,
      orderId: order._id,
      productId: item.productId?._id || item.productId,
      name: item.name,
      artist: item.productId?.artist || "-",
      image: item.productId?.images?.[0] || "",
      price: item.price,
      quantity: item.quantity,
      lineTotal: item.price * item.quantity,
      status: order.status,
      statusLabel: STATUS_LABELS[order.status] || order.status.toUpperCase(),
      courier: order.courier || "",
      trackingNumber: order.trackingNumber || "",
      createdAt: order.createdAt,
    })),
  );

export const getDashboardMe = async (req, res, next) => {
  // ดึงข้อมูล profile (username, email, role)
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
  //ดึงสถิติ — จำนวน order และยอดเงินที่จ่ายไปแล้ว (status: paid เท่านั้น)
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
  //ดึงเฉพาะ order ที่ยัง pending (รอชำระ)
  try {
    const userId = req.user?.userId;
    const orders = await Order.find({ userId, status: "pending" })
      .sort({ createdAt: -1 })
      .select("items status courier trackingNumber createdAt")
      .populate("items.productId", "images artist");

    return res.status(200).json({
      success: true,
      data: flattenOrderItems(orders),
    });
  } catch (error) {
    next(error);
  }
};

export const getMyHistory = async (req, res, next) => {
  //ดึงเฉพาะ order ที่ paid แล้ว (ประวัติ)
  try {
    const userId = req.user?.userId;
    const orders = await Order.find({ userId, status: "paid" })
      .sort({ createdAt: -1 })
      .select("items status courier trackingNumber createdAt")
      .populate("items.productId", "images artist");

    return res.status(200).json({
      success: true,
      data: flattenOrderItems(orders),
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  //ดึง order ทั้งหมด พร้อม summary รวม
  try {
    const userId = req.user?.userId;
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .select("items totalPrice status courier trackingNumber createdAt")
      .populate("items.productId", "images artist");

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
  //ดึงที่อยู่จัดส่งของ user
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
  //บันทึกหรืออัปเดตที่อยู่ (ถ้ามีอยู่แล้วก็ update ถ้ายังไม่มีก็ insert)
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
  //ลบที่อยู่
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
