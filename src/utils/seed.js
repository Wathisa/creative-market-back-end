import { Product } from "../modules/products/product.model.js";

export const seedProductsDirectly = async (req, res) => {
  try {
    const dummyProducts = [];
    const categories = ["Visual Art", "Craft & Handmade", "Music & Sound"];

    for (let i = 1; i <= 100; i++) {
      const randomCategory =
        categories[Math.floor(Math.random() * categories.length)];

      dummyProducts.push({
        slug: `creative-product-item-unique-${i}-${Math.floor(Math.random() * 10000)}`, // 2 & 3. ลบปีกกาเกินออก และกันการซ้ำกันของข้อมูล
        category: randomCategory,
        name: `สินค้าแฮนด์เมดชิ้นที่ ${i}`,
        cartName: `Item #${i}`,
        artist: `ศิลปินนิรนาม หมายเลข ${i}`,
        price: 150,
        quantity: 10,
      });
    }

    const result = await Product.insertMany(dummyProducts);

    res.status(201).json({
      success: true,
      message: `เย้! เสกข้อมูลสินค้าเข้าคลังสำเร็จทั้งหมด ${result.length} ชิ้นแล้วค่ะ `,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "อุ๊ย มีบางอย่างผิดพลาดค่ะ",
      error: error.message,
    });
  }
};

export const updateAllQuantities = async (req, res, next) => {
  try {
    // 1. สั่งอัปเดตสินค้า "ทุกชิ้น" ใน Database ({}) ให้ฟิล์ด quantity กลายเป็น 99
    // ข้อมูลถูกส่งไปทำงานที่ Database ชั้นเดียวตรงๆ เลยค่ะ อ่านง่ายมาก
    const result = await Product.updateMany({}, { $set: { quantity: 99 } });

    // 2. ส่ง Response กลับไปบอกจำนวนรายการที่อัปเดตสำเร็จ
    res.status(200).json({
      success: true,
      message: `เสกสินค้าทั้งหมดจำนวน ${result.matchedCount} ชิ้นให้กลายเป็น 99 ชิ้นเรียบร้อยค่ะ!`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};
