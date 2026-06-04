# E-commerce Best Practices: Payment, Address & Order Integrity

เอกสารฉบับนี้สรุปมาตรฐานระดับสากล (Professional Standards) สำหรับการออกแบบระบบซื้อขาย (Checkout Flow) โดยเน้นความยืดหยุ่นเพื่อให้สามารถนำไปปรับใช้ได้กับทุกโปรเจกต์ (Framework-agnostic)

---

## 💎 1. ปรัชญาหลัก: "Intent over Default" (เลือกด้วยเจตนา)

เราจะไม่ใช้ระบบ "เลือกให้ล่วงหน้า" (Default Selection) ในจุดที่สำคัญต่อเงินในกระเป๋าผู้ใช้และสต็อกสินค้า แต่จะใช้ระบบ **"ยืนยันเจตนา" (Explicit Selection)**

### ทำไมต้องทำ?
- **ลด Error:** ป้องกันผู้ใช้กดสั่งซื้อโดยไม่รู้ตัวว่าใช้ช่องทางชำระเงินหรือที่อยู่ที่ตนเองไม่ได้ต้องการ
- **Data Integrity:** ข้อมูลใน Database จะสะท้อนสิ่งที่ผู้ใช้ "เลือกจริงๆ" 100% ไม่ใช่ค่าที่ระบบสุ่มให้
- **Audit:** ตรวจสอบย้อนกลับ (Audit Trail) ได้แม่นยำเมื่อเกิดปัญหาการชำระเงิน

---

## 💳 2. มาตรฐานการชำระเงิน (Payment System)

### ✅ สิ่งที่ควรทำ (The Best)
- **Backend Re-calculation:** Backend ต้องคำนวณราคาสินค้าใหม่จากฐานข้อมูลเสมอ **ห้ามเชื่อถือราคา (Price) ที่ส่งมาจาก Frontend**
- **Enum Validation:** จำกัดช่องทางการชำระเงินด้วย `enum` เพื่อป้องกันการส่งค่าขยะเข้าสู่ระบบ
- **Atomic Stock Update:** ใช้คำสั่งลดสต็อกแบบ Atomic (เช่น `$inc: -quantity` พร้อมเงื่อนไข `$gte: quantity`) เพื่อป้องกัน **Race Condition** (คนกดพร้อมกันจนสต็อกติดลบ)
- **Payment Snapshot:** บันทึกราคาและชื่อสินค้าลงใน Order ทันที (ห้ามใช้แค่การ Link ID) เพื่อป้องกันข้อมูลเพี้ยนเมื่อสินค้าถูกแก้ไขหรือลบในอนาคต

### ❌ สิ่งที่ไม่ควรทำ (The Don'ts)
- **No Default Payment:** ห้ามตั้งค่า Default ให้ Payment Method เพื่อบังคับให้ Frontend ต้องส่งค่ามาเสมอ
- **No Direct Update:** ห้ามดึงค่าสต็อกมาลบใน Code แล้วค่อย Save กลับ (Read-Modify-Write) เพราะจะเกิดปัญหาข้อมูลไม่ตรงกันเมื่อมี Traffic สูง

### ⚠️ จุดที่ต้องระวัง (Warnings)
- **Race Conditions:** สต็อกสินค้าคือจุดที่เปราะบางที่สุด ต้องใช้ Database-level validation เท่านั้น
- **Transaction Rollback:** หากการสร้าง Order หรือการตัดสต็อกล้มเหลว ต้องมีระบบ **Rollback** (เช่น Mongoose Session) เพื่อคืนสต็อกทันที

---

## 📍 3. มาตรฐานการจัดการที่อยู่ (Address Management)

### ✅ สิ่งที่ควรทำ (The Best)
- **Flexible Priority Resolution:** ระบบควรฉลาดพอที่จะเลือกที่อยู่ตามลำดับความสำคัญ:
    1.  **Manual Address:** (ถ้าผู้ใช้กรอกใหม่) > ให้ใช้ค่านี้ก่อน
    2.  **Saved Address ID:** (ถ้าผู้ใช้เลือกจาก List) > ให้ไปดึงจาก Profile
    3.  **Default Address:** (ถ้าไม่ได้เลือกเลย) > ให้ดึงค่า Default จาก Profile
- **Address Snapshotting:** **สำคัญมาก!** ต้อง Copy ข้อมูลที่อยู่ทั้งหมดลงในก้อน Order (ไม่ใช่เก็บแค่ ID) เพราะหากผู้ใช้เปลี่ยนที่อยู่ใน Profile ในภายหลัง ออเดอร์ที่เคยสั่งไปแล้วต้องแสดงที่อยู่เดิมที่เคยส่งจริง

### ❌ สิ่งที่ไม่ควรทำ (The Don'ts)
- **Reference Only:** ห้ามเก็บที่อยู่ใน Order เป็นแค่ `addressId` เพราะถ้า User ลบหรือแก้ไขที่อยู่ใน Profile ประวัติการส่งใน Order จะเพี้ยนหรือหายไปทันที
- **Trusting Profile Always:** อย่าดึงที่อยู่จาก Profile มาแสดงในหน้า Order History แบบ Real-time (ต้องดึงจาก Snapshot ที่เก็บไว้ใน Order เท่านั้น)

### ⚠️ จุดที่ต้องระวัง (Warnings)
- **Partial Address:** ตรวจสอบฟิลด์บังคับให้ครบ (ชื่อ, เบอร์, จังหวัด, รหัสไปรษณีย์) ก่อนบันทึกเข้า Order แม้จะเป็นที่อยู่ที่ดึงมาจาก Profile ก็ตาม

---

## 🛡️ 4. ตารางสรุป Do & Don't สำหรับนักพัฒนา

| หัวข้อ | ✅ สิ่งที่ต้องทำ (Do) | ❌ ห้ามทำ (Don't) |
| :--- | :--- | :--- |
| **ราคา (Price)** | คำนวณใหม่ที่ Backend เสมอ | เชื่อราคาจาก Frontend |
| **สต็อก (Stock)** | ตัดสต็อกแบบ Atomic (`$inc`) | ดึงมาลบใน Code แล้ว Save |
| **ช่องทางจ่ายเงิน** | บังคับส่งค่า (Required) | ตั้งค่า Default (Promptpay) |
| **ที่อยู่ (Address)** | ทำ Snapshot ลงใน Order | เก็บแค่ ID หรือ Link ไป Profile |
| **ข้อมูลสินค้า** | เก็บ Snapshot (ชื่อ, ราคา) | ใช้แค่ `.populate()` ID สินค้า |
| **ความผิดพลาด** | ใช้ Transaction (Rollback) | ปล่อยให้สต็อกหายแต่ Order ไม่เกิด |

---
*Created & Maintained by Gemini CLI - Engineering Excellence Suite*
