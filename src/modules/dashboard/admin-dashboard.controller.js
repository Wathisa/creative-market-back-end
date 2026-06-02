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

const getCustomerLookup = async (orders) => {
  const userIds = [
    ...new Set(orders.map((order) => order.userId).filter(Boolean)),
  ];
  const users = await User.find({ _id: { $in: userIds } }).select(
    "username email",
  );

  return new Map(
    users.map((user) => [String(user._id), user.username || user.email || "-"]),
  );
};

const flattenOrders = (orders, customerLookup) =>
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
      courier: null,
      trackingNumber: null,
      createdAt: order.createdAt,
      date: order.createdAt,
    })),
  );

const getMetricsFromPaidOrders = (paidOrders) => {
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      sales: 0,
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  paidOrders.forEach((order) => {
    const bucketKey = new Date(order.createdAt).toISOString().slice(0, 10);
    const bucket = bucketMap.get(bucketKey);

    if (bucket) {
      bucket.sales += order.totalPrice;
    }
  });

  return buckets.map(({ label, sales }) => ({ label, sales }));
};

const getCategoryBreakdown = (paidOrders) => {
  const categoryTotals = new Map();

  paidOrders.forEach((order) => {
    order.items.forEach((item) => {
      const category = item.productId?.category || "Unknown";

      const currentTotal = categoryTotals.get(category) || 0;
      categoryTotals.set(category, currentTotal + item.quantity);
    });
  });

  return Array.from(categoryTotals.entries()).map(([label, value]) => ({
    label,
    value,
    sold: `${value} ชิ้น`,
    color: CATEGORY_COLORS[label] || "#94a3b8",
  }));
};

const loadOrdersWithProducts = () =>
  Order.find({})
    .sort({ createdAt: -1 })
    .populate("items.productId", "images artist category");

export const getAdminOverview = async (req, res, next) => {
  try {
    const orders = await loadOrdersWithProducts();
    const paidOrders = orders.filter((order) => order.status === "paid");
    const customerLookup = await getCustomerLookup(orders);
    const flattenedOrders = flattenOrders(orders, customerLookup);
    const metrics = getMetricsFromPaidOrders(paidOrders);

    return res.status(200).json({
      success: true,
      data: {
        ...metrics,
        salesOverview: getSalesOverview(paidOrders),
        categoryBreakdown: getCategoryBreakdown(paidOrders),
        recentOrders: flattenedOrders.slice(0, 6),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrders = async (req, res, next) => {
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