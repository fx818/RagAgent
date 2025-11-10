import express from "express";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", auth, (req, res) => {
    res.json({
        message: "Profile fetched successfully",
        user: req.user
    });
});

export default router;