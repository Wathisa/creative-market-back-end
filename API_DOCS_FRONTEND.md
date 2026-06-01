# 🛒 API Documentation: Cart, Checkout & Payment
เอกสารฉบับนี้จัดทำขึ้นสำหรับ Frontend เพื่อใช้ในการเชื่อมต่อระบบตะกร้าสินค้าและการสั่งซื้อ

---

## 🔐 Authentication & Authorization
- ทุกเส้น API ในส่วนนี้ต้องแนบ **Cookie** (`user_token` หรือ `admin_token`)
- ระบบใช้ Middleware `verifyToken` เพื่อระบุตัวตนผู้ใช้ผ่าน `userId`

---

## 🛍️ 1. Cart Module (ระบบตะกร้า)

### 📂 Model Schema (Cart)
```typescript
{
  _id: string;
  userId: string;
  items: [
    {
      productId: string; // Populate ได้ข้อมูล Product
      quantity: number;
    }
  ];
  updatedAt: string;
}
```

### 📍 Endpoints
#### **GET** `/api/cart/`
- **Description**: ดึงข้อมูลตะกร้าของ User ปัจจุบัน
- **Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "...",
    "items": [
      {
        "productId": "...",
        "name": "Product Name",
        "price": 500,
        "quantity": 2,
        "subtotal": 1000
      }
    ],
    "totalPrice": 1000,
    "totalItems": 2
  }
}
```

#### **POST** `/api/cart/add`
- **Description**: เพิ่มสินค้าลงตะกร้า (ถ้ามีอยู่แล้วจะบวกเพิ่ม / Increment)
- **Body**: `{ "productId": string, "quantity": number }`

#### **PATCH** `/api/cart/update`
- **Description**: อัปเดตจำนวนสินค้าแบบ **กำหนดค่าใหม่ (Absolute)**
- **Logic**: ถ้าส่ง `quantity: 0` จะเป็นการลบสินค้าออกจากตะกร้า
- **Body**: `{ "productId": string, "quantity": number }`

#### **DELETE** `/api/cart/remove/:productId`
- **Description**: ลบสินค้าเฉพาะชิ้นออกจากตะกร้า

#### **DELETE** `/api/cart/clear`
- **Description**: ล้างตะกร้าทั้งหมด

---

## 📍 1.5 Address Module (ระบบที่อยู่ - เก็บลง DB)

### 📂 Model Schema (Address)
```typescript
{
  _id: string;
  userId: string;
  name: string;      // เช่น "บ้าน", "ที่ทำงาน"
  detail: string;    // ที่อยู่โดยละเอียด (บ้านเลขที่, ถนน, แขวง, เขต, จังหวัด, รหัสไปรษณีย์)
  isDefault: boolean;
}
```

### 📍 Endpoints
#### **GET** `/api/addresses/`
- **Description**: ดึงรายการที่อยู่ทั้งหมดของผู้ใช้

#### **POST** `/api/addresses/`
- **Description**: เพิ่มที่อยู่ใหม่
- **Body**: `{ "name": string, "detail": string, "isDefault": boolean }`

#### **DELETE** `/api/addresses/:id`
- **Description**: ลบที่อยู่

---

## 📦 2. Checkout & Order Module (ระบบสั่งซื้อ)

### 📂 Model Schema (Order) - *Updated*
```typescript
{
  _id: string;
  userId: string;
  items: [
    {
      productId: string;
      name: string;   // Snapshot ชื่อสินค้าขณะซื้อ
      price: number;  // Snapshot ราคาขณะซื้อ
      quantity: number;
    }
  ];
  totalPrice: number;
  shippingAddress: { // Snapshot ที่อยู่ขณะซื้อ (ป้องกันปัญหาผู้ใช้ไปลบ/แก้ที่อยู่ภายหลัง)
    name: string;
    detail: string;
  };
  status: "pending" | "paid" | "cancelled";
  paymentMethod: "promptpay";
  paymentRef: string; // เลขที่อ้างอิงการโอนเงิน (จาก Slip)
  paidAt?: Date;
  createdAt: Date;
}
```

สรุปคือ:
   1. Address Model: เป็นไฟล์แยก (สร้างใหม่) เพื่อเก็บ "คลังที่อยู่" ของผู้ใช้
   2. Order Model: เพิ่มฟิลด์ shippingAddress เข้าไปข้างใน (ไม่ต้องสร้างไฟล์ใหม่) เพื่อ "บันทึกสำเนา" ที่อยู่ ณ วันที่ซื้อครับ

### 📍 Endpoints
#### **POST** `/api/orders/checkout`
- **Description**: สร้างคำสั่งซื้อจากสินค้าในตะกร้า
- **Body**: `{ "addressId": string, "paymentMethod": string }`
- **Logic สำคัญ**:
  - **Address Snapshot**: ดึงข้อมูลจาก `Address ID` มาบันทึกลงใน `shippingAddress` ของ Order ทันที
  - **Atomic Stock Deduction**: เช็คและหักสต็อกทันที ป้องกันของขาด
  - **Cart Cleanup**: **[สำคัญ]** เมื่อสร้าง Order สำเร็จแล้ว ระบบ Backend ต้องทำการล้างตะกร้า (`Clear Cart`) ของ User ทันที
  - **Database Transaction**: ถ้ามีขั้นตอนใดผิดพลาด ระบบจะ Rollback ทั้งหมด (คืนสต็อก/ไม่สร้างออเดอร์/ไม่ล้างตะกร้า)
- **Response Success (201)**: `{ "success": true, "data": { Order Object } }`

#### **GET** `/api/orders/`
- **Description**: ดูประวัติการสั่งซื้อทั้งหมดของตัวเอง (เรียงจากใหม่ไปเก่า)

#### **GET** `/api/orders/:orderId`
- **Description**: ดูรายละเอียดออเดอร์รายตัว (มีการเช็ค Ownership: ดูได้เฉพาะออเดอร์ตัวเอง)

---

## 💳 3. Payment & Admin (ระบบชำระเงินและจัดการ)

#### **PATCH** `/api/orders/status/:orderId`
- **Description**: อัปเดตสถานะออเดอร์ (Mock Payment)
- **Body**: `{ "status": "paid" | "cancelled" }`
- **Logic**: ถ้าเปลี่ยนเป็น `cancelled` ระบบจะคืนสต็อกสินค้าให้โดยอัตโนมัติ

#### **GET** `/api/orders/all` (Admin Only)
- **Description**: สำหรับ Admin ดูรายการสั่งซื้อทั้งหมดในระบบ

---

## 🏗️ 4. Scope งาน & Logic (Controller)

### 🔵 Frontend Scope
1.  **Cart Controller (Hook `useCart`):**
    *   สร้าง Hook จัดการ State ของตะกร้า และดึงข้อมูลจาก `GET /api/cart`
    *   คำนวณ `totalPrice` และ `totalItems` แบบ Real-time
2.  **Address Controller (Hook `useAddress`):**
    *   สร้าง Hook จัดการดึงข้อมูลที่อยู่จาก `GET /api/addresses`
    *   ใช้สำหรับเพิ่ม (`POST`) และลบ (`DELETE`) ที่อยู่
    *   นำ Hook นี้ไปใช้ร่วมกันระหว่างหน้า **Checkout (`CheckoutForm.jsx`)** และหน้า **User Dashboard (`MyAddress.jsx`)** เพื่อให้ข้อมูล Sync กัน (Single Source of Truth)
3.  **Checkout Logic:**
    *   รวบรวม `selectedAddressId` และ `paymentMethod` ส่งไปที่ `POST /api/orders/checkout`
    *   รับ `orderId` กลับมาเพื่อส่งต่อไปยังหน้า Payment
4.  **Payment Logic:**
    *   ส่ง `PATCH /api/orders/status/:orderId` เพื่อยืนยันการชำระเงิน (Mock)
    *   นำทางไปยังหน้า Complete

### 🟢 Backend Scope
1.  **Atomic Stock Deduction:** ทุกครั้งที่มีการสร้าง Order ต้องใช้ Database Transaction เช็คและหักสต็อก ป้องกันของขาด
2.  **Order Snapshot:** บันทึกข้อมูลที่อยู่ (Address) ณ ตอนนั้นลงในออเดอร์ทันที
3.  **Cart Cleanup:** เมื่อสร้าง Order สำเร็จ ต้อง Clear Cart ของผู้ใช้ออกเสมอ

---

## ⚠️ Error Responses
- **400 Bad Request**: สต็อกสินค้าไม่พอ หรือข้อมูลไม่ถูกต้อง
- **401 Unauthorized**: ไม่พบ Token หรือไม่ได้ Login
- **404 Not Found**: ไม่พบสินค้า/ออเดอร์ หรือไม่มีสิทธิ์เข้าถึง (ในกรณีแอบดูออเดอร์คนอื่น)
- **500 Internal Server Error**: ข้อผิดพลาดที่ระบบฐานข้อมูล
