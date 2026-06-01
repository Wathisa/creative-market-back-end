import { Address } from "./address.model.js";

// 1. ดึงรายการที่อยู่ทั้งหมดของผู้ใช้
export const getMyAddresses = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    next(error);
  }
};

// 2. เพิ่มที่อยู่ใหม่
export const createAddress = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { name, detail, isDefault } = req.body;

    // ถ้าตั้งเป็น Default ให้ไปยกเลิกอันอื่นก่อน
    if (isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    const newAddress = await Address.create({
      userId,
      name,
      detail,
      isDefault: !!isDefault
    });

    res.status(201).json({ success: true, data: newAddress });
  } catch (error) {
    next(error);
  }
};

// 3. ลบที่อยู่
export const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const deletedAddress = await Address.findOneAndDelete({ _id: id, userId });

    if (!deletedAddress) {
      const error = new Error("ไม่พบที่อยู่นี้ หรือคุณไม่มีสิทธิ์ลบ");
      error.status = 404;
      throw error;
    }

    res.status(200).json({ success: true, message: "ลบที่อยู่เรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};
