import axios from "axios";

import TwitchDropsUsers from "../models/TwitchDropsUsers.js";
import TwitchDropsList from "../models/TwitchDropsList.js";

const COOLDOWN = parseInt(process.env.DROP_COOLDOWN_SECONDS || "10", 10);

import { getTwitchAppToken } from "../utils/twitchAppToken.js";

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
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  console.log(
    "FULFILLED:",
    user.twitchId,
    fulfillRes.data.data.map((d) => d.id)
  );

  try {
    const { token, server } = req.query;

    if (!token || token !== process.env.UNITY_API_KEY) {
      return res.status(403).send("odulyok");
    }

    const serverField =
      server === "EU"
        ? "serverEU"
        : server === "NA"
        ? "serverNA"
        : server === "ASIA"
        ? "serverASIA"
        : null;

    if (!serverField) {
      return res.send("odulyok");
    }

    const users = await TwitchDropsUsers.find({
      [serverField]: 1,
      "drops.0": { $exists: true },
    });

    if (!users.length) {
      return res.send("odulyok");
    }

    const appToken = await getTwitchAppToken();
    const response = {};

    for (const user of users) {
      const entitlementIds = user.drops
        .map((d) => d.entitlementId)
        .filter(Boolean);

      if (!entitlementIds.length) continue;

      try {
        const fulfillRes = await axios.patch(
          "https://api.twitch.tv/helix/entitlements/drops",
          {
            entitlement_ids: entitlementIds,
            fulfillment_status: "FULFILLED",
          },
          {
            headers: {
              "Client-ID": process.env.TWITCH_CLIENT_ID,
              Authorization: `Bearer ${appToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!fulfillRes.data || !fulfillRes.data.data?.length) {
          throw new Error("Fulfillment failed");
        }

        response[user.steamId] = {
          drops: [...new Set(user.drops.map((d) => d.benefitId))].join(","),
        };

        user[serverField] = 0;
        user.drops = [];
        await user.save();
      } catch (err) {
        console.error("Twitch fulfillment error:", user.twitchId);
      }
    }

    return Object.keys(response).length
      ? res.json(response)
      : res.send("odulyok");
  } catch {
    return res.send("odulyok");
  }
};
