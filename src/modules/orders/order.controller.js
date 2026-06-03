import mongoose from "mongoose";
import { Order } from "./order.model.js";
import { Cart } from "../cart/cart.model.js";
import { Product } from "../products/product.model.js";
import { Address } from "../address/address.model.js";

// 1. สร้าง Order จากตะกร้า (Checkout)
export const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user?.userId;
    const { paymentMethod = "promptpay" } = req.body;

    if (!userId) {
      const error = new Error("กรุณาเข้าสู่ระบบก่อนสั่งซื้อ");
      error.status = 401;
      throw error;
    }

    // [NEW] 1. ล้างออเดอร์ Pending เดิมและคืนสต็อกก่อนเริ่มสร้างอันใหม่
    // เพื่อป้องกันการจองของซ้ำซ้อนในกรณีลูกค้ากด Checkout หลายรอบ
    const existingPendingOrder = await Order.findOne({ userId, status: "pending" }).session(session);
    if (existingPendingOrder) {
      for (const item of existingPendingOrder.items) {
        await Product.findByIdAndUpdate(
          item.productId, 
          { $inc: { quantity: item.quantity } }, 
          { session }
        );
      }
      await Order.deleteOne({ _id: existingPendingOrder._id }).session(session);
    }

    // 2. ดึงข้อมูลที่อยู่เดียวของผู้ใช้เพื่อทำ Snapshot
    const addressDoc = await Address.findOne({ userId }).session(session);
    if (!addressDoc || !addressDoc.address) {
      const error = new Error("ไม่พบข้อมูลที่อยู่จัดส่ง กรุณาระบุที่อยู่ในหน้า Profile ก่อนสั่งซื้อ");
      error.status = 400;
      throw error;
    }

    const addr = addressDoc.address;

    // 3. ดึงข้อมูลตะกร้าล่าสุด
    const cart = await Cart.findOne({ userId }).populate("items.productId").session(session);

    if (!cart || cart.items.length === 0) {
      const error = new Error("ไม่มีสินค้าในตะกร้า");
      error.status = 400;
      throw error;
    }

    let totalPrice = 0;
    const orderItems = [];

    // 4. วนลูปเช็คและหักสต็อกสินค้าทีละชิ้น
    for (const item of cart.items) {
      const product = item.productId;

      if (!product) {
        const error = new Error("พบสินค้าบางรายการถูกลบออกจากระบบ กรุณาตรวจสอบตะกร้าอีกครั้ง");
        error.status = 400;
        throw error;
      }

      // หักสต็อกสินค้าแบบ Atomic และเช็คว่าพอไหมในตัวเดียวกัน (ป้องกัน Race Condition)
      const updatedProduct = await Product.findOneAndUpdate(
        { 
          _id: product._id, 
          quantity: { $gte: item.quantity } // ต้องมีสต็อก >= จำนวนที่สั่ง
        },
        { 
          $inc: { quantity: -item.quantity } 
        },
        { new: true, session }
      );

      if (!updatedProduct) {
        const error = new Error(`สินค้า ${product.name} ในคลังไม่พอ (อาจมีคนซื้อตัดหน้าไปก่อน)`);
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
    }

    // 5. สร้าง Order ใหม่
    const newOrder = await Order.create([{
      userId,
      items: orderItems,
      totalPrice,
      shippingAddress: {
        recipientName: addr.recipientName,
        phone: addr.phone,
        street: addr.street,
        district: addr.district,
        province: addr.province,
        postcode: addr.postcode
      },
      status: "pending",
      paymentMethod,
    }], { session });

    // ⛔️ [REMOVE] บรรทัด await Cart.findOneAndDelete({ userId }, { session }); ออก!!!
    // เราจะยังไม่ลบตะกร้าในขั้นตอนนี้ เพื่อให้ลูกค้าสามารถกลับมาดูตะกร้าได้จนกว่าจะจ่ายเงิน
    console.log(`[Order] Order created for User ${userId}. Cart is NOT deleted.`);

    // ยืนยัน Transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "สร้างคำสั่งซื้อสำเร็จและตัดสต็อกเรียบร้อย (ตะกร้ายังคงอยู่จนกว่าจะชำระเงิน)",
      data: newOrder[0],
    });
  } catch (error) {
    // ยกเลิก Transaction และคืนสต็อกที่หักไปแล้วอัตโนมัติ (Rollback)
    await session.abortTransaction();
    session.endSession();
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

// 3. ดูรายละเอียด Order ตัวเดียว (พร้อมเช็คสิทธิ์เจ้าของ)
export const getOrderDetails = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.userId;

    // ค้นหา Order โดยระบุทั้ง ID และ User ID เพื่อป้องกันการแอบดูของคนอื่น
    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      const error = new Error("ไม่พบคำสั่งซื้อนี้ หรือคุณไม่มีสิทธิ์เข้าถึง");
      error.status = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// 4. อัปเดตสถานะ Order (จำกัดเฉพาะแอดมิน หรือ Mock Payment)
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      const error = new Error("ไม่พบคำสั่งซื้อนี้");
      error.status = 404;
      throw error;
    }

    // ถ้าเปลี่ยนสถานะเป็น cancelled และสถานะเดิมไม่ใช่ cancelled ให้คืนสต็อก
    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { quantity: item.quantity },
        });
      }
    }

    order.status = status;
    if (status === "paid") {
      order.paidAt = new Date();
      
      // 🔔 [NEW] เมื่อชำระเงินสำเร็จ (paid) ให้ล้างตะกร้าสินค้าทันที
      console.log(`[Order] Payment confirmed for Order ${order._id}. Clearing cart for User ${order.userId}...`);
      await Cart.findOneAndDelete({ userId: order.userId });
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `อัปเดตสถานะเป็น ${status} เรียบร้อยแล้ว ${status === 'paid' ? 'และล้างตะกร้าสินค้าแล้ว' : ''}`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// 5. สำหรับ Admin: ดูรายการสั่งซื้อทั้งหมด
export const getAllOrders = async (req, res, next) => {
  try {
    // ในอนาคตควรมี RequireRole('admin') ที่ Middleware เส้นนี้
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};
