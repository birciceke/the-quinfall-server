import express from "express";
import {
  collectTwitchDrops,
  fulfillTwitchDrops,
} from "../controllers/twitch-drops.js";

const router = express.Router();

router.post("/twitch/collect", collectTwitchDrops);
router.get("/twitch/fulfill", fulfillTwitchDrops);

export default router;
