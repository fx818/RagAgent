import jwt from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Unauthorized: You need to login" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both 'id' and 'userId' in JWT payloads
    const userId = decoded.id || decoded.userId;
    if (!userId)
      return res.status(400).json({ message: "Invalid token payload: no user id" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user)
      return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Token invalid or expired" });
  }
};
