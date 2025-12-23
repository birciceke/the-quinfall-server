import express from "express";

import {
  redirectToSteam,
  handleSteamReturn,
  handleSteamLogout,
} from "../controllers/steam-auth.js";

const router = express.Router();

router.get("/steam/auth", redirectToSteam);
router.get("/steam/return", handleSteamReturn);
router.get("/steam/logout", handleSteamLogout);

export default router;
