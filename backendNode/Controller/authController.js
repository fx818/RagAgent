// import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// import { PrismaClient } from "@prisma/client";
import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();


export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check existing user
        const userExists = await prisma.user.findUnique({
            where: { email }
        });

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword
            }
        });

        // JWT Token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) return res.status(400).json({ message: "Invalid email or password" });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

        // JWT Token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};



export const settings = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from auth middleware
    const { username, password } = req.body;

    // Get the current user from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // This should theoretically not happen if auth middleware is working
      return res.status(404).json({ message: "User not found." });
    }

    // --- Input Validation ---

    // 1. Check if there's anything to update
    if (!username && !password) {
      return res.status(400).json({ 
        message: "Please provide either a new username or a new password to update." 
      });
    }

    const updateData = {};

    // 3. Prepare username for update
    if (username) {
      if (typeof username !== 'string' || username.trim().length === 0) {
        return res.status(400).json({ message: "Username must be a non-empty string." });
      }
      updateData.username = username.trim();
    }

    // 4. Prepare password for update
    if (password) {
      // Check if new password is same as old password
      const isSamePassword = await bcrypt.compare(password, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          message: "New password cannot be the same as the old password.",
        });
      }

      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long." });
      }
      // Hash the new password before saving
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateData.password = hashedPassword;
    }

    // --- Database Update ---

    // Find the user and update their data
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
      // Select only the fields you want to return
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // --- Success Response ---
    res.status(200).json({
      message: "Settings updated successfully.",
      user: updatedUser,
    });

  } catch (error) {
    // --- Error Handling ---
    console.error("Error in settings endpoint:", error);

    // Handle potential unique constraint errors (e.g., if username is already taken)
    // Prisma's error code for unique constraint violation is P2002
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
        return res.status(409).json({ message: "This username is already taken." });
    }

    res.status(500).json({ 
      message: "An error occurred while updating settings." 
    });
  }
};




export const getMe = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from auth middleware

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      // IMPORTANT: Select only the fields that are safe to send to the client
      // NEVER send the password hash
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // --- Success Response ---
    res.status(200).json({
      message: "User data fetched successfully.",
      user: user,
    });

  } catch (error) {
    // --- Error Handling ---
    console.error("Error in getMe endpoint:", error);
    res.status(500).json({ 
      message: "An error occurred while fetching user data." 
    });
  }
};