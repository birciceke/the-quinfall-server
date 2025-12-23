import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

import TwitchDropsUsers from "../models/TwitchDropsUsers.js";

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL;
const TWITCH_SERVER_CALLBACK_URI = process.env.TWITCH_SERVER_CALLBACK_URI;

export const redirectToTwitch = (req, res) => {
  const scope = "user:read:email";
  const state = "twitch_state_security_token";
  const twitchAuthUrl = "https://id.twitch.tv/oauth2/authorize";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: TWITCH_SERVER_CALLBACK_URI,
    scope,
    state,
  });

  res.redirect(`${twitchAuthUrl}?${params.toString()}`);
};

export const handleTwitchCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (state !== "twitch_state_security_token") {
      return res.redirect(`${CLIENT_URL}/twitch-drops?error=StateMismatch`);
    }

    const tokenUrl = "https://id.twitch.tv/oauth2/token";
    const tokenData = new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: TWITCH_SERVER_CALLBACK_URI,
    });

    const tokenResponse = await axios.post(tokenUrl, tokenData.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const { access_token } = tokenResponse.data;

    const userUrl = "https://api.twitch.tv/helix/users";
    const userResponse = await axios.get(userUrl, {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${access_token}`,
      },
    });

    const twitchUser = userResponse.data.data[0];
    req.session.twitchUser = twitchUser;

    const dropsUrl = "https://api.twitch.tv/helix/entitlements/drops";
    const dropsResponse = await axios.get(dropsUrl, {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        Authorization: `Bearer ${access_token}`,
      },
      params: {
        user_id: twitchUser.id,
        first: 50,
      },
    });

    const dropsData = dropsResponse.data.data || [];

    const dropIds = dropsData.map((d) => d.benefit_id).filter(Boolean);

    const steamUser = req.session.steamUser;

    await TwitchDropsUsers.findOneAndUpdate(
      { twitchId: twitchUser.id },
      {
        steamId: steamUser?.steamid || null,
        twitchId: twitchUser.id,
        drops: dropIds,
        serverEU: 1,
        serverNA: 1,
        serverASIA: 1,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const redirectParams = new URLSearchParams();
    redirectParams.set("twitchLinked", true);
    redirectParams.set("twitchUsername", twitchUser.display_name);
    redirectParams.set("twitchId", twitchUser.id);
    if (steamUser) {
      redirectParams.set("steamId", steamUser.steamid);
      redirectParams.set("username", steamUser.personaname);
      redirectParams.set("avatar", steamUser.avatarmedium);
    }

    res.redirect(`${CLIENT_URL}/twitch-drops?${redirectParams.toString()}`);
  } catch (err) {
    console.error("Twitch callback error:", err);
    const steamUser = req.session.steamUser;
    let fallbackParams = "";
    if (steamUser) {
      fallbackParams = `?steamId=${steamUser.steamid}&username=${steamUser.personaname}&avatar=${steamUser.avatarmedium}&twitchLinked=false`;
    }
    res.redirect(`${CLIENT_URL}/twitch-drops${fallbackParams}`);
  }
};

export const handleTwitchLogout = (req, res) => {
  if (req.session.twitchUser) delete req.session.twitchUser;

  const steamUser = req.session.steamUser;
  const redirectParams = new URLSearchParams();

  if (steamUser) {
    redirectParams.set("steamId", steamUser.steamid);
    redirectParams.set("username", steamUser.personaname);
    redirectParams.set("avatar", steamUser.avatarmedium);
  }

  redirectParams.set("twitchLinked", false);
  res.redirect(`${CLIENT_URL}/twitch-drops?${redirectParams.toString()}`);
};
