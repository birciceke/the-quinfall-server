import axios from "axios";

export const redirectToSteam = (req, res) => {
  const steamOpenId = "https://steamcommunity.com/openid/login";
  const returnUrl = `${process.env.SERVER_URL}/api/steam/return`;

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnUrl,
    "openid.realm": process.env.SERVER_URL,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  res.redirect(`${steamOpenId}?${params.toString()}`);
};

export const handleSteamReturn = async (req, res) => {
  try {
    const verificationData = new URLSearchParams();

    for (const key in req.query) {
      verificationData.set(key, req.query[key]);
    }

    verificationData.set("openid.mode", "check_authentication");

    const response = await axios.post(
      "https://steamcommunity.com/openid/login",
      verificationData.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    if (!response.data.includes("is_valid:true")) {
      console.error(
        "Steam OpenID verification failed! The response did not confirm a valid authentication."
      );
      return res.status(400).json({ message: "Invalid Steam authentication!" });
    }

    const claimedId = req.query["openid.claimed_id"];
    if (!claimedId) {
      console.error(
        "Steam authentication succeeded, but no claimed_id was returned!"
      );
      return res
        .status(400)
        .json({ message: "Steam ID could not be retrieved!" });
    }

    const steamId = claimedId.split("/").pop();
    const apiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`;

    const profileRes = await axios.get(apiUrl);
    const player = profileRes.data.response.players[0];

    req.session.steamUser = {
      steamid: player.steamid,
      personaname: player.personaname,
      avatarmedium: player.avatarmedium,
    };

    const twitchUser = req.session.twitchUser;
    const redirectParams = new URLSearchParams({
      steamId: player.steamid,
      username: player.personaname,
      avatar: player.avatarmedium,
      twitchLinked: Boolean(twitchUser),
    });

    if (twitchUser) {
      redirectParams.set("twitchUsername", twitchUser.display_name);
      redirectParams.set("twitchId", twitchUser.id);
    }

    res.redirect(
      `${process.env.CLIENT_URL}/twitch-drops?${redirectParams.toString()}`
    );
  } catch (err) {
    console.error(
      "An unexpected error occurred during the Steam authentication process: ",
      err.response?.data || err.message
    );
    res.redirect(`${process.env.CLIENT_URL}/twitch-drops`);
  }
};

export const handleSteamLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(
        "An error occurred while attempting to terminate the user session: ",
        err.message
      );
    }

    res.redirect(`${process.env.CLIENT_URL}/twitch-drops`);
  });
};
