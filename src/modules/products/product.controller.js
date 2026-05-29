import { Product } from "./product.model.js";

// 1. ดึงข้อมูลสินค้า
export const getProducts = async (req, res, next) => {
  try {
    const { featured, search } = req.query;

    let query = {};
    if (featured === "true") {
      query = { isFeatured: true };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { cartName: { $regex: search, $options: "i" } },
        // { category: { $regex: search, $options: "i" } },
        { artist: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// 2. สร้างสินค้าใหม่
export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// 3. อัปเดตข้อมูลสินค้า
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
    });

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    next(error);
  }
};

// 4. ลบสินค้า
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// 5. ดึงรายการหมวดหมู่สินค้าทั้งหมด (ไม่ซ้ำกัน)
export const getCategories = async (req, res, next) => {
  try {
    // .distinct() จะไปค้นหาค่าใน field 'category' แล้วกรองเอาเฉพาะค่าที่ไม่ซ้ำกันมาให้จ้ะ
    const categories = await Product.distinct("category");
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// Get product by slug ดึงสินค้าจากชื่อ slug
export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
