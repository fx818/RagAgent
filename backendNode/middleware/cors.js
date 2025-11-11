// middleware/corsMiddleware.js
import cors from "cors";

const allowedOrigins = [
  "http://localhost:3000",         // Local development
  "https://ragagent-xi.vercel.app" // Deployed frontend
];

const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
});

export default corsMiddleware;
