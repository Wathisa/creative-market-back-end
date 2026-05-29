import express from "express";
import { checkEmail, registerUser } from "../modules/register/user.controller.js";

export const router = express.Router();

router.get("/check-email", checkEmail);
router.post("/register", registerUser);