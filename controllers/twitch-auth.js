import axios from "axios";

import TwitchDropsUser from "../models/twitch-drops-user.js";

const TWITCH_STATE = "twitch_state_security_token";

export const redirectToTwitch = (req, res) => {
  const twitchAuthUrl = "https://id.twitch.tv/oauth2/authorize";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TWITCH_CLIENT_ID,
    redirect_uri: process.env.TWITCH_SERVER_CALLBACK_URI,
    scope: "user:read:email",
    state: TWITCH_STATE,
  });

  res.redirect(`${twitchAuthUrl}?${params.toString()}`);
};

export const handleTwitchCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (state !== TWITCH_STATE) {
      console.error(
        "Twitch OAuth state validation failed! Possible CSRF attempt detected."
      );
      return res.redirect(
        `${process.env.CLIENT_URL}/twitch-drops?error=StateMismatch`
      );
    }

    const tokenResponse = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.TWITCH_SERVER_CALLBACK_URI,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${access_token}`,
      },
    });

    const twitchUser = userResponse.data.data[0];
    req.session.twitchUser = twitchUser;

    const dropsResponse = await axios.get(
      "https://api.twitch.tv/helix/entitlements/drops",
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${access_token}`,
        },
        params: {
          user_id: twitchUser.id,
          first: 50,
        },
      }
    );

    const dropIds = (dropsResponse.data.data || [])
      .map((drop) => drop.benefit_id)
      .filter(Boolean);

    const steamUser = req.session.steamUser;

    await TwitchDropsUser.findOneAndUpdate(
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

    const redirectParams = new URLSearchParams({
      twitchLinked: true,
      twitchUsername: twitchUser.display_name,
      twitchId: twitchUser.id,
    });

    if (steamUser) {
      redirectParams.set("steamId", steamUser.steamid);
      redirectParams.set("username", steamUser.personaname);
      redirectParams.set("avatar", steamUser.avatarmedium);
    }

    res.redirect(
      `${process.env.CLIENT_URL}/twitch-drops?${redirectParams.toString()}`
    );
  } catch (error) {
    console.error(
      "An error occurred during the Twitch OAuth callback process:",
      error.response?.data || error.message
    );

    const steamUser = req.session.steamUser;
    const fallbackParams = new URLSearchParams();

    if (steamUser) {
      fallbackParams.set("steamId", steamUser.steamid);
      fallbackParams.set("username", steamUser.personaname);
      fallbackParams.set("avatar", steamUser.avatarmedium);
    }

    fallbackParams.set("twitchLinked", false);

    res.redirect(
      `${process.env.CLIENT_URL}/twitch-drops?${fallbackParams.toString()}`
    );
  }
};

export const handleTwitchLogout = (req, res) => {
  if (req.session.twitchUser) {
    delete req.session.twitchUser;
  }

  const steamUser = req.session.steamUser;
  const redirectParams = new URLSearchParams();

  if (steamUser) {
    redirectParams.set("steamId", steamUser.steamid);
    redirectParams.set("username", steamUser.personaname);
    redirectParams.set("avatar", steamUser.avatarmedium);
  }

  redirectParams.set("twitchLinked", false);

  res.redirect(
    `${process.env.CLIENT_URL}/twitch-drops?${redirectParams.toString()}`
  );
};
