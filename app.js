// Imports
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import session from "express-session";
import dotenv from "dotenv";

import connection from "./data/connection.js";
import subscriptionRoutes from "./routes/subscription.js";
import newsRoutes from "./routes/news.js";
import steamRoutes from "./routes/steam.js";
import twitchRoutes from "./routes/twitch.js";
import twitchDropsRoutes from "./routes/twitchDrops.js";

// Config
dotenv.config();

const urlencodedConfig = {
  extended: true,
  inflate: true,
  limit: "1MB",
  parameterLimit: 5000,
  type: "application/x-www-form-urlencoded",
};

const corsConfig = {
  origin: process.env.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

const limiter = {
  windowMs: 15 * 60 * 1000,
  limit: 10000,
  message: "Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin!",
};

const sessionConfig = {
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
};

// App
const app = express();
app.disable("x-powered-by");

// MongoDB Connection
connection();

// Middlewares
app.use(express.urlencoded(urlencodedConfig));
app.use(express.json());
app.use(helmet());
app.use(cors(corsConfig));
app.use(rateLimit(limiter));
app.use(session(sessionConfig));

// Routes
app.use("/api/", subscriptionRoutes);
app.use("/api/", newsRoutes);
app.use("/api/", steamRoutes);
app.use("/api/", twitchRoutes);
app.use("/api/", twitchDropsRoutes);

// Error Management
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Sunucu hatası meydana geldi!" });
});

// Listen Port
app.listen(process.env.PORT, () => {
  console.log(`Sunucu ${process.env.PORT} portunda başlatıldı!`);
});
