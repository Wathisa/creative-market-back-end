import { Cart } from "./cart.model.js";
import { Product } from "../products/product.model.js";

// Helper สำหรับคำนวณยอดรวมและจัดรูปแบบข้อมูลก่อนส่งกลับ
const formatCartResponse = (cart) => {
  if (!cart) return null;
  
  const cartObj = cart.toObject();
  let totalPrice = 0;
  let totalItems = 0;

  // กรองเอาเฉพาะไอเทมที่มีข้อมูลสินค้าจริงๆ (ป้องกันกรณีสินค้าถูกลบออกจากระบบ)
  const formattedItems = cartObj.items.map((item) => {
    const product = item.productId;
    const itemSubtotal = product ? (product.price || 0) * item.quantity : 0;
    
    if (product) {
      totalPrice += itemSubtotal;
      totalItems += item.quantity;
    }

    return {
      productId: product?._id || item.productId,
      name: product?.name || "ไม่พบข้อมูลสินค้า",
      price: product?.price || 0,
      images: product?.images || [],
      artist: product?.artist || "Unknown",
      category: product?.category || "Uncategorized",
      tags: product?.tags || [],
      stock: product?.quantity || 0,
      quantity: item.quantity,
      subtotal: itemSubtotal
    };
  });

  return {
    _id: cartObj._id,
    userId: cartObj.userId,
    items: formattedItems,
    totalPrice,
    totalItems,
    updatedAt: cartObj.updatedAt
  };
};

// ดึงข้อมูลตะกร้าของ User (ดึง ID จาก req.user ที่ได้จาก Cookie)
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      const error = new Error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      error.status = 401;
      throw error;
    }

    const cart = await Cart.findOne({ userId }).populate(
      "items.productId",
      "name price images artist category tags quantity"
    );


    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { userId, items: [], totalPrice: 0, totalItems: 0 },
      });
    }

    res.status(200).json({ success: true, data: formatCartResponse(cart) });
  } catch (error) {
    next(error);
  }
};

export const addItemToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      const error = new Error("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า");
      error.status = 401;
      throw error;
    }

    // ตรวจสอบข้อมูลสินค้าและสต็อก
    const product = await Product.findById(productId);
    if (!product) {
      const error = new Error("ไม่พบสินค้านี้ในระบบ");
      error.status = 404;
      throw error;
    }

    const addQuantity = Number(quantity) || 1;

    let cart = await Cart.findOne({ userId });

    if (cart) {
      const itemIndex = cart.items.findIndex((p) => p.productId.toString() === productId.toString());
      
      if (itemIndex > -1) {
        // กรณีมีสินค้าเดิมอยู่แล้ว: ให้บวกเพิ่ม (Increment)
        const currentQuantity = cart.items[itemIndex].quantity;
        const newTotalQuantity = currentQuantity + addQuantity;

        console.log(`Debug: Found existing item. Current: ${currentQuantity}, Adding: ${addQuantity}, NewTotal: ${newTotalQuantity}`);

        if (newTotalQuantity > product.quantity) {
          const error = new Error(`สินค้าในคลังไม่พอ (ในตะกร้ามี ${currentQuantity}, เพิ่มอีก ${addQuantity} ไม่ได้ เพราะสต็อกเหลือ ${product.quantity})`);
          error.status = 400;
          throw error;
        }
        
        cart.items[itemIndex].quantity = newTotalQuantity;
        cart.markModified('items'); // <--- บังคับให้ Mongoose รู้ว่ามีการแก้ไขใน Array
      } else {
        // กรณีไม่มีสินค้าชิ้นนี้ในตะกร้ามาก่อน
        if (addQuantity > product.quantity) {
          const error = new Error(`สินค้าในคลังไม่พอ (สต็อกเหลือ ${product.quantity})`);
          error.status = 400;
          throw error;
        }
        cart.items.push({ productId, quantity: addQuantity });
      }
      await cart.save();
    } else {
      // กรณีไม่มีตะกร้าเลย: สร้างตะกร้าใหม่
      if (addQuantity > product.quantity) {
        const error = new Error(`สินค้าในคลังไม่พอ (สต็อกเหลือ ${product.quantity})`);
        error.status = 400;
        throw error;
      }
      cart = await Cart.create({
        userId,
        items: [{ productId, quantity: addQuantity }],
      });
    }

    await cart.populate("items.productId", "name price images artist category tags quantity");
    res.status(200).json({ success: true, data: formatCartResponse(cart) });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body; // quantity ส่งมาเป็นจำนวนใหม่ที่ต้องการกำหนด (Absolute Value)
    const userId = req.user?.userId;

    if (!userId) {
      const error = new Error("กรุณาเข้าสู่ระบบก่อนจัดการตะกร้า");
      error.status = 401;
      throw error;
    }

    const newQuantity = Number(quantity);
    if (isNaN(newQuantity) || newQuantity < 0) {
      const error = new Error("จำนวนสินค้าต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0");
      error.status = 400;
      throw error;
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      const error = new Error("ไม่พบตะกร้าสินค้า");
      error.status = 404;
      throw error;
    }

    const itemIndex = cart.items.findIndex((p) => p.productId.toString() === productId.toString());
    if (itemIndex > -1) {
      // ถ้ากำหนดเป็น 0 ให้ลบสินค้าออกจากตะกร้า
      if (newQuantity === 0) {
        cart.items = cart.items.filter((item) => item.productId.toString() !== productId.toString());
      } else {
        // ตรวจสอบสต็อกสินค้าก่อนอัปเดต
        const product = await Product.findById(productId);
        if (!product) {
          const error = new Error("ไม่พบสินค้านี้ในระบบ");
          error.status = 404;
          throw error;
        }

        if (product.quantity < newQuantity) {
          const error = new Error(`สินค้าในคลังไม่พอ (ต้องการ ${newQuantity}, แต่สต็อกเหลือ ${product.quantity})`);
          error.status = 400;
          throw error;
        }
        
        cart.items[itemIndex].quantity = newQuantity;
      }

      cart.markModified('items');
      await cart.save();
      await cart.populate("items.productId", "name price images artist category tags quantity");
      res.status(200).json({ success: true, data: formatCartResponse(cart) });
    } else {
      const error = new Error("ไม่พบสินค้านี้ในตะกร้า");
      error.status = 404;
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      const error = new Error("กรุณาเข้าสู่ระบบก่อนจัดการตะกร้า");
      error.status = 401;
      throw error;
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      const error = new Error("ไม่พบตะกร้าสินค้า");
      error.status = 404;
      throw error;
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();
    
    await cart.populate("items.productId", "name price images artist category tags quantity");
    res.status(200).json({ success: true, data: formatCartResponse(cart) });
  } catch (error) {
    next(error);
  }
};

// Get cart by user id
export const getCartByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          userId,
          items: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// ล้างตะกร้าของ User คนนั้นๆ
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      const error = new Error("กรุณาเข้าสู่ระบบก่อนจัดการตะกร้า");
      error.status = 401;
      throw error;
    }

    console.log(`[Cart] Clearing cart for User ${userId}...`);
    await Cart.findOneAndDelete({ userId });
    res.status(200).json({ success: true, message: "ล้างตะกร้าเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};