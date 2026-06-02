import mongoose from "mongoose";
import { Product } from "../modules/products/product.model.js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── helpers ──────────────────────────────────────────
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]; // สุ่มแบบไม่ bias

const CATEGORIES = ["Visual Art", "Craft & Handmade", "Music & Sound"];

const buildProducts = (count) =>
  Array.from({ length: count }, (_, i) => ({
    name: `Creative Masterpiece No.${i + 1}`,
    slug: `creative-masterpiece-no-${i + 1}`,
    description: `Handcrafted item #${i + 1} by a talented community artist.`,
    price: randomInt(100, 2100),
    category: pick(CATEGORIES), // สุ่มจริง ไม่ใช่ modulo
    image: `https://picsum.photos/600/600?random=${i + 1}`,
    stock: randomInt(1, 20),
  }));

// ── seed ─────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔋 MongoDB Connected");

    await Product.deleteMany(); // ล้างของเก่าก่อนเสมอ
    const products = buildProducts(100);
    await Product.insertMany(products, { ordered: false }); // ordered:false = ถ้าชิ้นไหน fail ยังไม่หยุด
    console.log(`🎉 Seeded ${products.length} products`);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect(); // ปิด connection เสมอ
    console.log("🔌 Disconnected");
  }
};

seed();
