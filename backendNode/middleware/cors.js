// middleware/corsMiddleware.js
import cors from "cors";

const allowedOrigins = [
  "http://localhost:3000",
  "https://ragagent-xi.vercel.app",
  "https://ragagent-bujm.onrender.com", // ✅ allow backend’s own origin for preflight
];

const corsMiddleware = cors({
  origin: function (origin, callback) {
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
