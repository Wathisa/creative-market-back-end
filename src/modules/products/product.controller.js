import { Product } from "./product.model.js";
import cloudinary from "../../utils/cloudinary.js";
import fs from "fs"; // ใช้สำหรับลบไฟล์ชั่วคราว

// 1. ดึงข้อมูลสินค้า
export const getProducts = async (req, res, next) => {
  try {
    const { featured, search, limit } = req.query;

    let query = {};
    if (featured === "true") {
      query = { isFeatured: true };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { cartName: { $regex: search, $options: "i" } },
        { artist: { $regex: search, $options: "i" } },
      ];
    }

    let productQuery = Product.find(query);

    if (limit) {
      productQuery = productQuery.limit(Number(limit));
    }

    const products = await productQuery;
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// 2. สร้างสินค้าใหม่
export const createProduct = async (req, res, next) => {
  try {
    let imageUrl = "url_of_the_image_placeholder.png";

    // 1. ถ้ามีไฟล์แนบมา ให้โยนขึ้น Cloudinary
    if (req.file) {
      const cloudResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "artist_drops", // ตั้งชื่อโฟลเดอร์ใน Cloudinary ได้ตามใจชอบ
      });
      imageUrl = cloudResult.secure_url;

      // ลบไฟล์ชั่วคราวในโฟลเดอร์ uploads/ ทิ้ง เพื่อไม่ให้รกเซิร์ฟเวอร์
      fs.unlinkSync(req.file.path);
    }

    // 2. แปลงข้อมูลที่เป็น Array (เพราะ Frontend ส่งมาเป็น JSON String ใน FormData)
    const description = req.body.description
      ? JSON.parse(req.body.description)
      : [];
    const fromArtist = req.body.fromArtist
      ? JSON.parse(req.body.fromArtist)
      : [];

    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

    // 3. นำข้อมูลทั้งหมดเซฟลง Database
    const product = await Product.create({
      ...req.body,
      description,
      fromArtist,
      tags,
      images: [imageUrl], // 👈 ใส่ URL ที่ได้จาก Cloudinary เข้าไป
    });

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
