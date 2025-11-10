// index.js

import dotenv from 'dotenv';
dotenv.config(); // <--- CRITICAL: MUST BE THE FIRST EXECUTABLE LINE

import express from "express";
const app = express();
const backendPort = process.env.BACKEND_PORT || 3001;
// const path = require('path');
import corsMiddleware from "./middleware/cors.js";
import authRoutes from "./routes/authRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";
import qaRoutes from "./routes/qaRoutes.js";
import publicShareRoute from './routes/publicShareRouter.js';

app.use(corsMiddleware);
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/auth", protectedRoutes);
app.use('/api/qa', qaRoutes);

app.use('/', publicShareRoute)

app.listen(backendPort, () => {
  console.log(`Server is running on PORT ${backendPort}`);
});