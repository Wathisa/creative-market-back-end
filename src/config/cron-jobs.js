import { Order } from "../modules/orders/order.model.js";
import { Product } from "../modules/products/product.model.js";

/**
 * ฟังก์ชันสำหรับตรวจสอบและยกเลิกออเดอร์ที่ค้างชำระ (Pending) นานเกินไป
 * @param {number} expirationMinutes - เวลาหมดอายุ (นาที)
 */
export const cancelExpiredOrders = async (expirationMinutes = 30) => {
  try {
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() - expirationMinutes);

    // 1. ค้นหาออเดอร์ที่สถานะเป็น 'pending' และสร้างไว้นานกว่าเวลาที่กำหนด
    const expiredOrders = await Order.find({
      status: "pending",
      createdAt: { $lt: expirationDate },
    });

    if (expiredOrders.length === 0) return;

    console.log(`[Auto-Cancel] พบ ${expiredOrders.length} ออเดอร์ที่หมดอายุ กำลังดำเนินการยกเลิก...`);

    for (const order of expiredOrders) {
      // 2. คืนสต็อกสินค้าแต่ละรายการในออเดอร์
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { quantity: item.quantity },
        });
      }

      // 3. อัปเดตสถานะเป็น 'cancelled'
      order.status = "cancelled";
      await order.save();
      
      console.log(`[Auto-Cancel] ยกเลิกออเดอร์ ${order._id} และคืนสต็อกเรียบร้อยแล้ว`);
    }
  } catch (error) {
    console.error("[Auto-Cancel] เกิดข้อผิดพลาดในการยกเลิกออเดอร์อัตโนมัติ:", error);
  }
};

/**
 * ระบบจำลอง Cron Job แบบใช้ setInterval (สำหรับกรณีที่ไม่ต้องการลง library เพิ่ม)
 * จะรันทุกๆ 5 นาที
 */
export const startAutoCancelJob = () => {
  console.log("[Auto-Cancel] ระบบตรวจสอบออเดอร์หมดอายุเริ่มทำงาน (ทุก 5 นาที)...");
  
  // รันทันทีหนึ่งรอบตอนเริ่ม Server
  cancelExpiredOrders();

  // ตั้งเวลาให้รันทุกๆ 5 นาที (300,000 มิลลิวินาที)
  setInterval(() => {
    cancelExpiredOrders();
  }, 5 * 60 * 1000);
};
