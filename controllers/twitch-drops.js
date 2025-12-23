import TwitchDropsUser from "../models/twitch-drops-user.js";
import { TwitchDropsList } from "../models/twitch-drops-list.js";

const DROP_COOLDOWN_SECONDS = parseInt(
  process.env.DROP_COOLDOWN_SECONDS || "10",
  10
);

export const collectTwitchDrops = async (req, res) => {
  try {
    if (!req.session?.steamUser || !req.session?.twitchUser) {
      return res.status(401).json({
        success: false,
        message:
          "You are not authenticated or your session has expired! Please log in again to continue.",
      });
    }

    const steamId = req.session.steamUser.steamid;
    const twitchId = req.session.twitchUser.id;

    const now = Date.now();

    if (req.session.dropCooldown && now < req.session.dropCooldown) {
      return res.status(429).json({
        success: false,
        message: "Too many requests! Please wait a moment before trying again.",
      });
    }

    req.session.dropCooldown = now + DROP_COOLDOWN_SECONDS * 1000;

    const user = await TwitchDropsUser.findOne({ steamId, twitchId });

    if (!user?.drops?.length) {
      return res.json({
        success: false,
        message:
          "You haven’t earned any Twitch rewards yet! Keep watching streams to start earning them.",
      });
    }

    const currentDrops = user.drops.filter(Boolean);

    const existingDrops = await TwitchDropsList.find({
      dropId: { $in: currentDrops },
    }).select("dropId");

    const validDropIds = existingDrops.map((d) => d.dropId);
    const validDrops = currentDrops.filter((id) => validDropIds.includes(id));

    if (!validDrops.length) {
      return res.json({
        success: false,
        message: "No valid Twitch rewards were found!",
      });
    }

    return res.json({
      success: true,
      message:
        "Your Twitch reward has been successfully validated and will be delivered to your in-game account within 5 minutes!",
      currentDrops: validDrops,
    });
  } catch (error) {
    console.error(
      "An error occurred while collecting Twitch drops: ",
      error.message
    );
    res.status(500).json({ message: "An internal server error occurred!" });
  }
};

export const fulfillTwitchDrops = async (req, res) => {
  try {
    const { token, server } = req.query;

    if (!token || token !== process.env.UNITY_API_KEY) {
      return res.status(403).send("odulyok");
    }

    if (!server) {
      return res.status(400).send("odulyok");
    }

    const serverNormalized = server.trim().toUpperCase();

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

    const users = await TwitchDropsUser.find({
      [serverField]: 1,
      drops: { $exists: true, $ne: [] },
    });

    if (!users.length) {
      return res.send("odulyok");
    }

    const response = {};

    for (const user of users) {
      response[user.steamId] = {
        drops: user.drops.join(","),
      };

      user.drops = [];
      user[serverField] = 0;

      await user.save();
    }

    return res.json(response);
  } catch (error) {
    console.error(
      "An error occurred while fulfilling Twitch drops: ",
      error.message
    );
    return res.send("odulyok");
  }
};
