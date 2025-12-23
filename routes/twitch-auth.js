import express from "express";

import {
  redirectToTwitch,
  handleTwitchCallback,
  handleTwitchLogout,
} from "../controllers/twitch-auth.js";

const router = express.Router();

router.get("/twitch/auth", redirectToTwitch);
router.get("/twitch/callback", handleTwitchCallback);
router.get("/twitch/logout", handleTwitchLogout);

export default router;
