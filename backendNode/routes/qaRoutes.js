import express from "express";
import { auth } from "../middleware/auth.js";
import multer from "multer";
import {
  uploadFiles,
  askQuestion,
  getHistory,
  getConversationById,
  toggleConversationPublic,
  getPublicConversation, // ✅ add this
  createNewConversation, // ✅ add this below
  deleteConversation,
} from "../Controller/qaController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Secure routes
router.post("/upload", auth, upload.array("files"), uploadFiles);
router.post("/ask", auth, askQuestion);
router.get("/history", auth, getHistory);
router.get("/history/:conversationId", auth, getConversationById);
router.patch("/share/:conversationId", auth, toggleConversationPublic);

// ✅ Publicly accessible route
router.get("/:username/:conversationId", getPublicConversation);

// ✅ New conversation route
router.post("/new", auth, createNewConversation);

router.delete("/history/:conversationId", auth, deleteConversation);


export default router;
