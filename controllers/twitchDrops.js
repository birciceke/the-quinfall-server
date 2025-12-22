import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

import TwitchDropsUsers from "../models/TwitchDropsUsers.js";
import TwitchDropsList from "../models/TwitchDropsList.js";

import { getTwitchAppToken } from "../utils/twitchAppToken.js";

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_BROADCASTER_ID = process.env.TWITCH_BROADCASTER_ID;
const COOLDOWN = parseInt(process.env.DROP_COOLDOWN_SECONDS || "10", 10);

export const collectTwitchDrops = async (req, res) => {
  try {
    if (!req.session || !req.session.steamUser || !req.session.twitchUser) {
      return res.status(401).json({
        success: false,
        message:
          "You are not logged in or your session has expired. Please log in again to continue!",
      });
    }

    const steamId = req.session.steamUser.steamid;
    const twitchId = req.session.twitchUser.id;

    if (!req.session.dropCooldown) {
      req.session.dropCooldown = Date.now() + COOLDOWN * 1000;
    } else if (Date.now() < req.session.dropCooldown) {
      return res.status(429).json({
        success: false,
        message:
          "You have made too many requests! Please wait a moment and try again.",
      });
    } else {
      req.session.dropCooldown = Date.now() + COOLDOWN * 1000;
    }

    let user = await TwitchDropsUsers.findOne({ steamId, twitchId });
    if (!user || !user.drops || user.drops.length === 0) {
      return res.json({
        success: false,
        message:
          "You haven’t earned any Twitch rewards yet. Keep watching streams to start earning them!",
      });
    }

    const currentDrops = user.drops.filter(Boolean);

    const existing = await TwitchDropsList.find({
      dropId: { $in: currentDrops },
    }).select("dropId");

    const validDropIds = existing.map((e) => e.dropId);
    const validDrops = currentDrops.filter((id) => validDropIds.includes(id));

    if (validDrops.length === 0) {
      return res.json({
        success: false,
        message: "No valid Twitch rewards were found!",
      });
    }

    return res.json({
      success: true,
      message:
        "Your Twitch reward has been found and will be delivered to your in-game account within 5 minutes!",
      currentDrops: validDrops,
    });
  } catch (err) {
    console.error("collectTwitchDrops error:", err);
    res.status(500).json({ message: "Sunucu hatası meydana geldi! " });
  }
};

export const fulfillTwitchDrops = async (req, res) => {
  try {
    const { token, server } = req.query;

    const appToken = await getTwitchAppToken();

    console.log("INCOMING:", req.query);

    if (!token || token !== process.env.UNITY_API_KEY) {
      return res.status(403).send("odulyok");
    }

    if (!server) {
      return res.status(400).send("odulyok");
    }

    let serverNormalized = (server || "").trim().toUpperCase();

    const serverField =
      serverNormalized === "EU"
        ? "serverEU"
        : serverNormalized === "NA"
        ? "serverNA"
        : serverNormalized === "ASIA"
        ? "serverASIA"
        : null;

    if (!serverField) {
      return res.send("odulyok");
    }

    const users = await TwitchDropsUsers.find({
      [serverField]: 1,
      drops: { $exists: true, $ne: [] },
    });

    if (!users || users.length === 0) {
      return res.send("odulyok");
    }

    const response = {};

    for (const user of users) {
      response[user.steamId] = {
        drops: user.drops.map((d) => d.benefitId || d).join(","),
      };

      const entitlementIds = user.drops
        .map((d) => d.entitlementId)
        .filter(Boolean);

      if (entitlementIds.length > 0) {
        try {
          await axios.post(
            "https://api.twitch.tv/helix/entitlements/drops",
            {
              entitlement_ids: entitlementIds,
              fulfillment_status: "FULFILLED",
            },
            {
              params: {
                broadcaster_id: TWITCH_BROADCASTER_ID,
              },
              headers: {
                "Client-ID": TWITCH_CLIENT_ID,
                Authorization: `Bearer ${appToken}`,
                "Content-Type": "application/json",
              },
            }
          );
        } catch (err) {
          console.error(
            "Twitch fulfillment failed for user: ",
            user.twitchId,
            err?.response?.data || err.message
          );
        }
      }

      user.drops = [];
      user[serverField] = 0;

      await user.save();
    }

    return res.json(response);
  } catch (err) {
    console.error("fulfillTwitchDrops error:", err);
    return res.send("odulyok");
  }
};
