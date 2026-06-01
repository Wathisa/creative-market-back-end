import { Router } from "express";
import {
  getMyAddresses,
  createAddress,
  deleteAddress,
} from "../modules/addresses/address.controller.js";
import { verifyToken } from "../middlewares/login.auth.middleware.js";

export const router = Router();

router.use(verifyToken);

router.get("/", getMyAddresses);
router.post("/", createAddress);
router.delete("/:id", deleteAddress);
