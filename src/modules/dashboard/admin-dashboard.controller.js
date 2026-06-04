import { Order } from "../orders/order.model.js";
import { User } from "../register/user.model.js";

const STATUS_LABELS = {
  pending: "รอดำเนินการ",
  paid: "สำเร็จแล้ว",
  cancelled: "ยกเลิก",
};

const CATEGORY_COLORS = {
  "Visual Art": "#6366f1",
  "Craft & Handmade": "#8b5cf6",
  "Music & Sound": "#c4b5fd",
  Unknown: "#94a3b8",
};

const getLocalDateKey = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCustomerLookup = async (orders) => {
  //ดึง username/email ของ user ทุกคนที่มี order แล้วทำเป็น Map สำหรับ lookup เร็ว
  const userIds = [
    ...new Set(orders.map((order) => order.userId).filter(Boolean)),
  ];
  const users = await User.find({ _id: { $in: userIds } }).select(
    "username email",
  );

  return new Map(
    users.map((user) => [
      String(user._id),
      user.email || user.username || "-",
    ]),
  );
};

const flattenOrders = (
  orders,
  customerLookup, //แปลง orders หลายใบให้เป็น list แบนของ item แต่ละชิ้น พร้อมชื่อ customer
) =>
  orders.flatMap((order) =>
    order.items.map((item, index) => ({
      id: `${order._id}-${item.productId}-${index}`,
      orderId: order._id,
      productId: item.productId?._id || item.productId || null,
      name: item.name,
      artist: item.productId?.artist || "-",
      image: item.productId?.images?.[0] || "",
      quantity: item.quantity,
      price: item.price,
      amount: item.price * item.quantity,
      customer: customerLookup.get(order.userId) || "-",
      status: order.status,
      statusLabel: STATUS_LABELS[order.status] || order.status,
      courier: order.courier || "",
      trackingNumber: order.trackingNumber || "",
      createdAt: order.createdAt,
      date: order.createdAt,
    })),
  );

const mapRecentOrders = (orders, customerLookup) =>
  orders.map((order) => {
    const firstItem = order.items[0];
    const totalQuantity = order.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return {
      id: String(order._id),
      orderId: order._id,
      name: firstItem?.name || "Untitled order",
      artist: firstItem?.productId?.artist || "-",
      image: firstItem?.productId?.images?.[0] || "",
      quantity: totalQuantity,
      amount: order.totalPrice,
      customer: customerLookup.get(order.userId) || "-",
      status: order.status,
      statusLabel: STATUS_LABELS[order.status] || order.status,
      createdAt: order.createdAt,
      date: order.paidAt || order.createdAt,
    };
  });

const getMetricsFromPaidOrders = (paidOrders) => {
  //คำนวณ totalSales, จำนวน order, จำนวนชิ้น, ค่าเฉลี่ยต่อ order
  const totalSales = paidOrders.reduce(
    (sum, order) => sum + order.totalPrice,
    0,
  );
  const itemSold = paidOrders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );
  const orderCount = paidOrders.length;

  return {
    totalSales,
    orderCount,
    itemSold,
    averageOrderValue: orderCount > 0 ? totalSales / orderCount : 0,
  };
};

const getSalesOverview = (paidOrders) => {
  //สรุปยอดขายย้อนหลัง 7 วัน แยกตามวัน
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      key: getLocalDateKey(date),
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      date: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      sales: 0,
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  paidOrders.forEach((order) => {
    const sourceDate = order.paidAt || order.createdAt;
    const bucketKey = getLocalDateKey(sourceDate);
    const bucket = bucketMap.get(bucketKey);

    if (bucket) {
      bucket.sales += order.totalPrice;
    }
  });

  return buckets.map(({ label, date, sales }) => ({ label, date, sales }));
};

const getCategoryBreakdown = (paidOrders) => {
  //สรุปจำนวนชิ้นที่ขายได้แยกตาม category พร้อมสี
  const categoryTotals = new Map();

  paidOrders.forEach((order) => {
    order.items.forEach((item) => {
      const category = item.productId?.category || "Unknown";

      const currentTotal = categoryTotals.get(category) || 0;
      categoryTotals.set(category, currentTotal + item.quantity);
    });
  });

  const totalItems = Array.from(categoryTotals.values()).reduce(
    (sum, value) => sum + value,
    0,
  );

  return Array.from(categoryTotals.entries()).map(([label, value]) => ({
    label,
    value,
    sold: `${totalItems > 0 ? ((value / totalItems) * 100).toFixed(1) : "0.0"}%`,
    color: CATEGORY_COLORS[label] || "#94a3b8",
  }));
};

const loadOrdersWithProducts = () =>
  //ดึง order ทั้งหมดพร้อม populate ข้อมูล product
  Order.find({})
    .sort({ createdAt: -1 })
    .populate("items.productId", "images artist category");

export const getAdminOverview = async (req, res, next) => {
  //หน้า overview — metrics + กราฟ 7 วัน + category + 6 order ล่าสุด
  try {
    const orders = await loadOrdersWithProducts();
    const paidOrders = orders.filter((order) => order.status === "paid");
    const customerLookup = await getCustomerLookup(orders);
    const metrics = getMetricsFromPaidOrders(paidOrders);

    return res.status(200).json({
      success: true,
      data: {
        ...metrics,
        salesOverview: getSalesOverview(paidOrders),
        categoryBreakdown: getCategoryBreakdown(paidOrders),
        recentOrders: mapRecentOrders(orders, customerLookup).slice(0, 8),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrders = async (req, res, next) => {
  //หน้า orders — order ทั้งหมด + summary นับตาม status
  try {
    const orders = await loadOrdersWithProducts();
    const customerLookup = await getCustomerLookup(orders);
    const flattenedOrders = flattenOrders(orders, customerLookup);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          allOrders: flattenedOrders.length,
          pendingCount: flattenedOrders.filter(
            (order) => order.status === "pending",
          ).length,
          paidCount: flattenedOrders.filter((order) => order.status === "paid")
            .length,
          cancelledCount: flattenedOrders.filter(
            (order) => order.status === "cancelled",
          ).length,
        },
        orders: flattenedOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminSales = async (req, res, next) => {
  //หน้า sales — metrics + กราฟ 7 วัน + category (เฉพาะ paid)
  try {
    const orders = await loadOrdersWithProducts();
    const paidOrders = orders.filter((order) => order.status === "paid");
    const metrics = getMetricsFromPaidOrders(paidOrders);

    return res.status(200).json({
      success: true,
      data: {
        ...metrics,
        salesOverview: getSalesOverview(paidOrders),
        categoryBreakdown: getCategoryBreakdown(paidOrders),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderShipping = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { courier, trackingNumber } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.courier = String(courier || "").trim();
    order.trackingNumber = String(trackingNumber || "").trim();
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Shipping details updated successfully",
      data: {
        orderId: order._id,
        courier: order.courier,
        trackingNumber: order.trackingNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};
