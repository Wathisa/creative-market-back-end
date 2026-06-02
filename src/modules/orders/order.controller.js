import { Order } from "./order.model.js";
import { Cart } from "../cart/cart.model.js";
import { Product } from "../products/product.model.js";

// 1. สร้าง Order จากตะกร้า (Checkout)
export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      const error = new Error("กรุณาเข้าสู่ระบบก่อนสั่งซื้อ");
      error.status = 401;
      throw error;
    }

    // ดึงข้อมูลตะกร้าล่าสุดมา (ต้อง populate เพื่อเอาข้อมูลสต็อกและราคามาเช็ค)
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      const error = new Error("ไม่มีสินค้าในตะกร้า");
      error.status = 400;
      throw error;
    }

    let totalPrice = 0;
    const orderItems = [];

    // วนลูปเช็คสินค้าทีละชิ้นก่อนสร้าง Order
    for (const item of cart.items) {
      const product = item.productId;

      // บัคจุดที่ 1: สินค้าถูกลบออกจากระบบไปแล้ว (Null check)
      if (!product) continue;

      // บัคจุดที่ 2: เช็คสต็อกอีกรอบก่อนหักเงิน (ป้องกัน Race Condition)
      if (product.quantity < item.quantity) {
        const error = new Error(
          `สินค้า ${product.name} ในคลังไม่พอ (เหลือ ${product.quantity})`,
        );
        error.status = 400;
        throw error;
      }

      const subtotal = product.price * item.quantity;
      totalPrice += subtotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });

      // ทำการหักสต็อกสินค้าทันที (แบบ Atomic ป้องกันสต็อกติดลบ)
      await Product.findByIdAndUpdate(product._id, {
        $inc: { quantity: -item.quantity },
      });
    }

    if (orderItems.length === 0) {
      const error = new Error(
        "สินค้าในตะกร้าไม่พร้อมสั่งซื้อ (อาจถูกลบไปแล้ว)",
      );
      error.status = 400;
      throw error;
    }

    // สร้าง Order ใหม่
    const newOrder = await Order.create({
      userId,
      items: orderItems,
      totalPrice,
      status: "pending",
      paymentMethod: "promptpay",
    });

    // ล้างตะกร้าทิ้งเมื่อสั่งซื้อสำเร็จ
    await Cart.findOneAndDelete({ userId });

    res.status(201).json({
      success: true,
      message: "สร้างคำสั่งซื้อสำเร็จและตัดสต็อกเรียบร้อย",
      data: newOrder,
    });
  } catch (error) {
    next(error);
  }
};

// 2. ดึงรายการคำสั่งซื้อของ User (History)
export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// 3. ดูรายละเอียด Order ตัวเดียว
export const getOrderDetails = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      const error = new Error("ไม่พบคำสั่งซื้อนี้");
      error.status = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// 4. ปุ่มจำลองการ้าเงิน (Mock Payment) - เปลี่ยนสถานะเป็น paid
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // รับสถานะใหม่มา เช่น "paid" หรือ "cancelled"

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true },
    );

    if (!order) {
      const error = new Error("ไม่พบคำสั่งซื้อนี้");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: `อัปเดตสถานะเป็น ${status} เรียบร้อยแล้ว`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
