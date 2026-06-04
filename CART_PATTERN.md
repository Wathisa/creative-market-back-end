# Secure Cart & Authentication Integration Pattern

รูปแบบนี้ถูกออกแบบมาเพื่อระบบ E-commerce ที่เน้นความปลอดภัย (Cookie-based Auth) และความถูกต้องของข้อมูล (Data Integrity) โดยเฉพาะ

## 1. กฎการรับข้อมูล (Payload Rules)
- **ห้าม** รับ `userId` หรือข้อมูลที่ระบุตัวตนผู้ใช้จาก `req.body`, `req.params` หรือ `req.query` เด็ดขาด เพื่อป้องกันปัญหา ID Spoofing (การสวมรอย)
- **ต้อง** ดึง `userId` จาก `req.user` เสมอ ซึ่งค่านี้จะถูกใส่เข้ามาโดย Auth Middleware ที่ทำหน้าที่ถอดรหัสจาก HTTP-only Cookie

## 2. กฎการตรวจสอบความถูกต้อง (Validation Rules)
- **Product Existence**: ต้องตรวจสอบเสมอว่า `productId` ที่ส่งมามีอยู่จริงในฐานข้อมูลก่อนเพิ่มลงตะกร้า
- **Stock Validation**: ต้องนำจำนวนที่ผู้ใช้ต้องการ (`quantity`) ไปเปรียบเทียบกับ `product.quantity` (สต็อกจริง) เสมอ
- **Total Stock Limit**: หากผู้ใช้เพิ่มสินค้าที่มีอยู่ในตะกร้าแล้ว ต้องนำ `จำนวนเดิม + จำนวนใหม่` มาตรวจสอบกับสต็อกอีกครั้งว่าเกินหรือไม่

## 3. กฎการคำนวณและข้อมูลที่ส่งกลับ (Calculation & Response Rules)
- **On-the-fly Calculation**: ห้ามบันทึกค่า `totalPrice` ลงในฐานข้อมูลตะกร้าตรงๆ ให้คำนวณสดใหม่ทุกครั้งที่มีการร้องขอข้อมูล (Get/Add/Update/Remove)
- **Data Enrichment (สำคัญ)**: เพื่อให้หน้าบ้าน (Frontend) แสดงผลได้ครบถ้วนและทำงานได้ฉลาดขึ้น ข้อมูลที่ส่งกลับในแต่ละไอเทมต้องประกอบด้วย:
    - `category`: หมวดหมู่สินค้า
    - `tags`: แท็กของสินค้า (สำหรับโชว์หรือฟิลเตอร์)
    - `stock`: สต็อกจริงในระบบ (`product.quantity`) เพื่อให้หน้าบ้านใช้ล็อกปุ่มเพิ่มจำนวน (UX)
    - `subtotal`: ราคาสินค้านั้นๆ x จำนวนที่สั่ง
- **Population**: ต้องใช้ `.populate()` เพื่อดึงข้อมูลล่าสุดของสินค้า (ชื่อ, ราคา, รูปภาพ, สต็อก) มาใช้เสมอ เพื่อป้องกันปัญหาราคาหรือสต็อกในตะกร้าไม่อัปเดตตามความเป็นจริง

## 4. ความปลอดภัยและการตัดสต็อก (Security & Stock Integrity)
- **Cart != Order**: การเพิ่มสินค้าลงตะกร้า **"ห้าม"** หักสต็อกสินค้าในฐานข้อมูลเด็ดขาด
- **Actual Deduction**: การหักสต็อกสินค้าจะเกิดขึ้นที่ **Order Module (Checkout)** เท่านั้น และต้องใช้ Database Transaction ร่วมกับ Atomic Update (`$inc`) เพื่อป้องกันสต็อกติดลบหรือข้อมูลผิดพลาด

## 5. มาตรฐานการจัดการจำนวนสินค้า (Cart Quantity Management Pattern)
แยก Endpoint ตามพฤติกรรม (Intent) ดังนี้:

- **1. Increment Pattern (POST `/add`):**
    - **พฤติกรรม:** เป็นการ "บวกสะสม" (Accumulation) หากมีของเดิมอยู่แล้วให้บวกเพิ่ม
- **2. Absolute Update Pattern (PATCH `/update`):**
    - **พฤติกรรม:** เป็นการ "แทนที่" (Set Absolute) ด้วยจำนวนที่ระบุ หากระบุเป็น 0 ให้ลบออกจากตะกร้าอัตโนมัติ
- **3. Explicit Deletion (DELETE `/remove/:productId`):**
    - **พฤติกรรม:** ลบสินค้าออกจากตะกร้าทันทีโดยไม่สนจำนวน

## ตัวอย่างโครงสร้าง Response (`formatCartResponse`)
```javascript
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": "...",
        "name": "...",
        "price": 100,
        "images": [...],
        "artist": "...",
        "category": "Visual Art",
        "tags": ["handmade", "classic"],
        "stock": 10,     // สต็อกจริงในคลัง
        "quantity": 2,   // จำนวนที่สั่ง
        "subtotal": 200
      }
    ],
    "totalPrice": 200,
    "totalItems": 2
  }
}
```
