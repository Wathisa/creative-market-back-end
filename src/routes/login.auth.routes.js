import { Router } from "express";
import { loginUser } from "../modules/login/login.auth.controllers.js";

export const router = Router();

router.post("/login", loginUser);