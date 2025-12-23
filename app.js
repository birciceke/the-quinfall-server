import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import session from "express-session";
import dotenv from "dotenv";

import connection from "./data/connection.js";

import newsRoutes from "./routes/news.js";
import subscriptionRoutes from "./routes/subscription.js";
import steamAuthRoutes from "./routes/steam-auth.js";
import twitchAuthRoutes from "./routes/twitch-auth.js";
import twitchDropsRoutes from "./routes/twitch-drops.js";

dotenv.config();

const app = express();
app.disable("x-powered-by");

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
  message: "Too many requests have been made! Please try again later.",
};

const sessionConfig = {
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
};

connection();

app.use(express.urlencoded(urlencodedConfig));
app.use(express.json());
app.use(helmet());
app.use(cors(corsConfig));
app.use(rateLimit(limiter));
app.use(session(sessionConfig));

app.use("/api/", subscriptionRoutes);
app.use("/api/", newsRoutes);
app.use("/api/", steamAuthRoutes);
app.use("/api/", twitchAuthRoutes);
app.use("/api/", twitchDropsRoutes);

app.use((err, req, res, next) => {
  console.error("An unhandled server error occurred: ", err.message);
  res.status(500).json({ message: "An internal server error occurred!" });
});

app.listen(process.env.PORT, () => {
  console.log(
    `Server started successfully and is listening on port ${process.env.PORT}!`
  );
});
