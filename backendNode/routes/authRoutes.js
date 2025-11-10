import express from "express";
import { register, login, settings, getMe } from "../Controller/authController.js";

import {auth} from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.patch("/settings", auth, settings)
router.get('/getme', auth,  getMe)

export default router;