import { Cart } from "./cart.model.js";
import { Product } from "../products/product.model.js";

// Helper สำหรับคำนวณยอดรวมและจัดรูปแบบข้อมูลก่อนส่งกลับ
const formatCartResponse = (cart) => {
  const cartObj = cart.toObject();
  let totalPrice = 0;
  let totalItems = 0;

  cartObj.items.forEach((item) => {
    // ตรวจสอบว่ามีข้อมูลสินค้าที่ถูก populate มาจริงไหม
    if (item.productId && item.productId.price) {
      totalPrice += item.productId.price * item.quantity;
      totalItems += item.quantity;
    }
  });

  return {
    ...cartObj,
    totalPrice,
    totalItems,
  };
};

// ดึงข้อมูลตะกร้าของ User (ดึง ID จาก req.user ที่ได้จาก Cookie)
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      const error = new Error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      error.status = 401;
      throw error;
    }

    const cart = await Cart.findOne({ userId }).populate(
      "items.productId",
      "name price images artist category"
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
    const userId = req.user?._id;

    if (!userId) {
      const error = new Error("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า");
      error.status = 401;
      throw error;
    }

    const product = await Product.findById(productId);
    if (!product) {
      const error = new Error("ไม่พบสินค้านี้ในระบบ");
      error.status = 404;
      throw error;
    }

    if (product.quantity < quantity) {
      const error = new Error("สินค้าในคลังไม่เพียงพอ");
      error.status = 400;
      throw error;
    }

    let cart = await Cart.findOne({ userId });

    if (cart) {
      const itemIndex = cart.items.findIndex((p) => p.productId == productId);
      if (itemIndex > -1) {
        const newTotalQuantity = cart.items[itemIndex].quantity + quantity;
        if (newTotalQuantity > product.quantity) {
          const error = new Error("ไม่สามารถเพิ่มได้ จำนวนรวมเกินสต็อกที่มี");
          error.status = 400;
          throw error;
        }
        cart.items[itemIndex].quantity = newTotalQuantity;
      } else {
        cart.items.push({ productId, quantity });
      }
      await cart.save();
    } else {
      cart = await Cart.create({
        userId,
        items: [{ productId, quantity }],
      });
    }

    await cart.populate("items.productId", "name price images artist");
    res.status(200).json({ success: true, data: formatCartResponse(cart) });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      const error = new Error("กรุณาเข้าสู่ระบบก่อนจัดการตะกร้า");
      error.status = 401;
      throw error;
    }

    if (quantity <= 0) {
      return removeCartItem(req, res, next);
    }

    const product = await Product.findById(productId);
    if (!product) {
      const error = new Error("ไม่พบสินค้านี้ในระบบ");
      error.status = 404;
      throw error;
    }

    if (product.quantity < quantity) {
      const error = new Error("สินค้าในคลังไม่เพียงพอ");
      error.status = 400;
      throw error;
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      const error = new Error("ไม่พบตะกร้าสินค้า");
      error.status = 404;
      throw error;
    }

    const itemIndex = cart.items.findIndex((p) => p.productId == productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      await cart.save();
      await cart.populate("items.productId", "name price images artist");
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
    const userId = req.user?._id;
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
    
    await cart.populate("items.productId", "name price images artist");
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
    const userId = req.user?._id;
    if (!userId) {
      const error = new Error("กรุณาเข้าสู่ระบบก่อนจัดการตะกร้า");
      error.status = 401;
      throw error;
    }

    await Cart.findOneAndDelete({ userId });
    res.status(200).json({ success: true, message: "ล้างตะกร้าเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};