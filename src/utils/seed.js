import mongoose from "mongoose";
import dotenv from "dotenv"; // 🌟 1. นำเข้า dotenv เพื่อเปิดตาให้มองเห็นไฟล์ .env จ้า
import * as ProductModule from "../modules/products/product.model.js";
import { fileURLToPath } from "url";
import path from "path";

// 🌟 3. สั่งโหลดไฟล์คอนฟิกสภาพแวดล้อม (.env) จากพิกัดถอยหลังนอกโฟลเดอร์ src
dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── helpers ──────────────────────────────────────────
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]; // ระบบสุ่มแบบไม่ bias ของเธอ ชิคมากๆ จ้า

const CATEGORIES = ["Visual Art", "Craft & Handmade", "Music & Sound"];

const buildProducts = (count) =>
  Array.from({ length: count }, (_, i) => ({
    name: `Creative Masterpiece No.${i + 1}`,
    slug: `creative-masterpiece-no-${i + 1}`,
    cartName: `Masterpiece #${i + 1}`, // 🌟 เพิ่มคีย์บังคับตาม Schema เพื่อน
    artist: `Artist Name ${String.fromCharCode(65 + ((i + 1) % 26))}`, // 🌟 เพิ่มคีย์บังคับตาม Schema เพื่อน
    price: randomInt(100, 2100),
    category: pick(CATEGORIES),
    description: [
      `Handcrafted item #${i + 1} by a talented community artist.`,
      "100% human art only.",
    ], // 🌟 ครอบเป็นอาร์เรย์ตาม Schema เพื่อนจ้า
    fromArtist: [`"I created this piece number ${i + 1} with love."`], // 🌟 ครอบเป็นอาร์เรย์ตาม Schema เพื่อนจ้า
    images: [`https://picsum.photos/600/600?random=${i + 1}`], // 🌟 เปลี่ยนเป็นคีย์ images เติม s และครอบอาร์เรย์จ้า
    stock: randomInt(1, 20),
    quantity: randomInt(1, 20),
  }));

// ── seed ─────────────────────────────────────────────
const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    await mongoose.connect(mongoUri);
    console.log("🔋 MongoDB Connected");

    // แกะสลักเรียกตัวโมเดล Product ออกมาจากกล่องสากล
    const TargetModel = ProductModule.Product || ProductModule.default;

    await TargetModel.deleteMany(); // ล้างของเก่าก่อนเสมอ
    const products = buildProducts(100);

    await TargetModel.insertMany(products, { ordered: false }); // โครงสร้างสั่งเก็บแบบข้ามชิ้นพังของเธอ ยอดเยี่ยมมากจ้า
    console.log(`🎉 Seeded ${products.length} products successfully!`);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect(); // ปิด connection เสมอ
    console.log("🔌 Disconnected");
  }
};

seed();
