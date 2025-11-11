import axios from "axios";
import FormData from "form-data";
import { marked } from "marked";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();
const FASTAPI_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";


// --- Helper: Get or create latest conversation ---
const getOrCreateConversation = async (userId) => {
    let conversation = await prisma.conversation.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: { userId },
        });
    }
    return conversation;
};

// --- Controller: Upload Files ---
export const uploadFiles = async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res
            .status(400)
            .json({ status: "error", message: "No files uploaded." });
    }

    const form = new FormData();
    req.files.forEach((file) => {
        form.append("files", file.buffer, { filename: file.originalname });
    });

    try {
        const response = await axios.post(`${FASTAPI_URL}/upload`, form, {
            headers: { ...form.getHeaders() },
        });

        return res.status(200).json(response.data);
    } catch (error) {
        console.error("FastAPI Upload Error:", error.message);
        const detail = error.response ? error.response.data.detail : error.message;
        return res.status(500).json({
            status: "error",
            message: "Failed to upload files to QA server.",
            detail,
        });
    }
};

// --- Controller: Ask Question ---
export const askQuestion = async (req, res) => {
    const { prompt, conversationId } = req.body;
    const userId = req.user?.id;

    if (!prompt || !userId) {
        return res
            .status(400)
            .json({ status: "error", message: "Prompt or user missing." });
    }

    try {
        // 1️⃣ Fetch or create conversation
        let conversation;
        if (conversationId) {
            conversation = await prisma.conversation.findFirst({
                where: { id: parseInt(conversationId, 10), userId },
            });
        }
        if (!conversation) {
            conversation = await getOrCreateConversation(userId);
        }

        // 2️⃣ Save user message
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: "user",
                content: prompt,
            },
        });

        // 3️⃣ Call FastAPI
        const encodedPrompt = new URLSearchParams({ prompt }).toString();
        const response = await axios.post(`${FASTAPI_URL}/ask`, encodedPrompt, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        const answer = response.data.answer || "No response from model.";

        // 4️⃣ Save AI reply
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: "model",
                content: answer,
            },
        });

        // 5️⃣ Update last updated time
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
        });

        // 6️⃣ Respond to frontend
        return res.status(200).json({
            status: "success",
            answer,
            conversationId: conversation.id,
        });
    } catch (error) {
        console.error("❌ FastAPI Ask Error:", error);
        const detail = error.response ? error.response.data.detail : error.message;
        return res.status(500).json({
            status: "error",
            message: "Failed to get answer from QA server.",
            detail,
        });
    }
};

// --- Controller: Get Conversation History ---
export const getHistory = async (req, res) => {
    const userId = req.user.id;

    try {
        const conversations = await prisma.conversation.findMany({
            where: { userId },
            include: {
                _count: { select: { messages: true } },
                messages: {
                    orderBy: { createdAt: "asc" },
                    take: 1,
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const history = conversations.map((c) => ({
            id: c.id,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            messageCount: c._count.messages,
            title: c.messages[0]?.content || "New Conversation",
            isPublic: c.isPublic,
        }));

        return res.status(200).json({ status: "success", history });
    } catch (error) {
        console.error("❌ Prisma History Error:", error);
        return res
            .status(500)
            .json({ status: "error", message: "Failed to retrieve history." });
    }
};

// --- Controller: Get Conversation by ID ---
export const getConversationById = async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;

    try {
        const id = parseInt(conversationId, 10);
        if (isNaN(id)) {
            return res
                .status(400)
                .json({ status: "error", message: "Invalid conversation ID." });
        }

        const conversation = await prisma.conversation.findFirst({
            where: { id, userId },
            include: {
                messages: { orderBy: { createdAt: "asc" } },
            },
        });

        if (!conversation) {
            return res
                .status(404)
                .json({ status: "error", message: "Conversation not found." });
        }

        return res.status(200).json({ status: "success", conversation });
    } catch (error) {
        console.error("❌ Get Conversation Error:", error);
        return res
            .status(500)
            .json({ status: "error", message: "Failed to get conversation." });
    }
};


export const toggleConversationPublic = async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;

    try {
        const id = parseInt(conversationId, 10);
        if (isNaN(id)) {
            return res.status(400).json({ status: "error", message: "Invalid ID" });
        }

        const conversation = await prisma.conversation.findFirst({
            where: { id, userId },
            include: { user: { select: { username: true } } },
        });

        if (!conversation)
            return res
                .status(404)
                .json({ status: "error", message: "Conversation not found." });

        const updated = await prisma.conversation.update({
            where: { id },
            data: { isPublic: !conversation.isPublic },
        });

        const publicUrl = updated.isPublic
            ? `http://localhost:3001/api/qa/${conversation.user.username}/${updated.id}`
            : null;

        return res.status(200).json({
            status: "success",
            message: `Conversation is now ${updated.isPublic ? "public" : "private"
                }.`,
            isPublic: updated.isPublic,
            shareUrl: updated.isPublic
                ? `http://localhost:3001/${req.user.username}/${updated.id}`
                : null,
        });

    } catch (error) {
        console.error("❌ Toggle Share Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to toggle public/private.",
        });
    }
};




export const getPublicConversation = async (req, res) => {
    const { username, conversationId } = req.params;

    try {
        const id = parseInt(conversationId, 10);
        if (isNaN(id)) return res.status(400).send("Invalid conversation ID");

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) return res.status(404).send("User not found");

        const conversation = await prisma.conversation.findFirst({
            where: { id, userId: user.id, isPublic: true },
            include: { messages: { orderBy: { createdAt: "asc" } } },
        });

        if (!conversation)
            return res.status(404).send("Conversation not found or not public.");

        const renderedMessages = conversation.messages
            .map((m) => {
                const html = marked.parse(m.content || "");
                const roleClass = m.role === "user" ? "user" : "ai";
                return `<div class="msg ${roleClass}">${html}</div>`;
            })
            .join("");

        const chatHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${username}'s Shared Chat</title>
      <style>
        /* Base Layout */
        body {
          font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #f9fafb;
          color: #1f2937;
          margin: 0;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
        }

        .container {
          max-width: 760px;
          margin: 48px auto;
          background: white;
          border-radius: 14px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        /* Header */
        .header {
          background: linear-gradient(90deg, #1e40af, #3b82f6);
          color: white;
          padding: 14px 24px;
          font-size: 1.05rem;
          font-weight: 600;
          letter-spacing: 0.2px;
        }

        /* Chat Area */
        .chat {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Messages */
        .msg {
          padding: 10px 14px;
          border-radius: 14px;
          max-width: 75%;
          font-size: 0.94rem;
          word-wrap: break-word;
          line-height: 1.45;
        }

        .user {
          background: #2563eb;
          color: white;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }

        .ai {
          background: #f3f4f6;
          color: #111827;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }

        /* Markdown Styling */
        .msg h1, .msg h2, .msg h3 {
          font-size: 1rem;
          margin: 0.4em 0 0.3em;
        }

        .msg p {
          margin: 0.2em 0;
        }

        .msg code {
          background: #e2e8f0;
          padding: 2px 5px;
          border-radius: 4px;
          font-family: "Fira Code", monospace;
          font-size: 0.85em;
        }

        .msg pre {
          background: #1e293b;
          color: #f8fafc;
          padding: 10px;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 0.85rem;
          line-height: 1.3;
        }

        .msg ul, .msg ol {
          padding-left: 20px;
          margin: 4px 0;
        }

        .msg a {
          color: #2563eb;
          text-decoration: none;
        }

        .msg a:hover {
          text-decoration: underline;
        }

        .msg table {
          border-collapse: collapse;
          margin-top: 6px;
          width: 100%;
        }

        .msg th, .msg td {
          border: 1px solid #cbd5e1;
          padding: 4px 8px;
          text-align: left;
          font-size: 0.85rem;
        }

        .msg th {
          background: #f8fafc;
        }

        /* Footer */
        .footer {
          text-align: center;
          padding: 10px;
          font-size: 0.75rem;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }

        /* Mobile */
        @media (max-width: 640px) {
          .container {
            margin: 12px;
          }
          .msg {
            max-width: 100%;
            font-size: 0.9rem;
          }
          .chat {
            padding: 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">${username}'s Shared Chat</div>
        <div class="chat">${renderedMessages}</div>
        <div class="footer">Shared publicly via <strong>InsightStream</strong> ✨</div>
      </div>
    </body>
    </html>
    `;

        res.status(200).send(chatHtml);
    } catch (error) {
        console.error("Prisma Get Public Conversation Error:", error);
        res.status(500).send("Internal Server Error");
    }
};



export const createNewConversation = async (req, res) => {
    const userId = req.user.id;

    try {
        const convo = await prisma.conversation.create({
            data: { userId },
        });

        return res.status(200).json({
            status: "success",
            conversationId: convo.id,
        });
    } catch (error) {
        console.error("❌ Create Conversation Error:", error);
        return res
            .status(500)
            .json({ status: "error", message: "Failed to create new conversation." });
    }
};

export const deleteConversation = async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;

    try {
        const id = parseInt(conversationId, 10);
        if (isNaN(id)) {
            return res
                .status(400)
                .json({ status: "error", message: "Invalid conversation ID." });
        }

        // Ensure the conversation belongs to the current user
        const convo = await prisma.conversation.findFirst({
            where: { id, userId },
        });

        if (!convo) {
            return res
                .status(404)
                .json({ status: "error", message: "Conversation not found." });
        }

        // Delete all related messages first, then conversation
        await prisma.message.deleteMany({
            where: { conversationId: id },
        });

        await prisma.conversation.delete({
            where: { id },
        });

        return res.status(200).json({
            status: "success",
            message: "Conversation deleted successfully.",
        });
    } catch (error) {
        console.error("❌ Delete Conversation Error:", error);
        return res
            .status(500)
            .json({ status: "error", message: "Failed to delete conversation." });
    }
};
