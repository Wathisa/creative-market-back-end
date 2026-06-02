import { Router } from "express";
import { forgotPassword } from "../modules/forgotPass/forgot.auth.controller.js"; 
import { forgotPasswordLimiter } from "../middlewares/forgot.auth.middleware.js"; 

export const router = Router();

router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);