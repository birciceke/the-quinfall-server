import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL;
const SERVER_URL = process.env.SERVER_URL;
const STEAM_API_KEY = process.env.STEAM_API_KEY;

export const redirectToSteam = (req, res) => {
  const steamOpenId = "https://steamcommunity.com/openid/login";
  const returnUrl = `${SERVER_URL}/api/steam/return`;

  try {
    const serverUrlObj = new URL(SERVER_URL);
    var realm = serverUrlObj.origin;
  } catch (err) {
    console.error(
      "SERVER_URL geçersiz bir URL'dir. Realm için SERVER_URL kullanılıyor.",
      e
    );
    var realm = process.env.SERVER_URL;
  }

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnUrl,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  res.redirect(`${steamOpenId}?${params.toString()}`);
};

export const handleSteamReturn = async (req, res) => {
  try {
    const query = req.query;
    const verificationData = new URLSearchParams();

    for (const key in query) {
      verificationData.set(key, query[key]);
    }

    verificationData.set("openid.mode", "check_authentication");

    const response = await axios.post(
      "https://steamcommunity.com/openid/login",
      verificationData.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    if (!response.data.includes("is_valid:true")) {
      console.error(
        "Steam doğrulama hatası. Sunucu yanıtı is_valid:true içermiyor."
      );
      return res
        .status(400)
        .json({ message: "Steam kimlik doğrulaması geçersiz!" });
    }

    const claimedId = req.query["openid.claimed_id"];
    if (!claimedId)
      return res.status(400).json({ message: "Steam ID alınamadı!" });

    const steamId = claimedId.split("/").pop();
    const apiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`;

    const profileRes = await axios.get(apiUrl);
    const player = profileRes.data.response.players[0];

    req.session.steamUser = {
      steamid: player.steamid,
      personaname: player.personaname,
      avatarmedium: player.avatarmedium,
    };

    const twitchUser = req.session.twitchUser;
    const redirectParams = new URLSearchParams();

    redirectParams.set("steamId", player.steamid);
    redirectParams.set("username", player.personaname);
    redirectParams.set("avatar", player.avatarmedium);

    if (twitchUser) {
      redirectParams.set("twitchLinked", true);
      redirectParams.set("twitchUsername", twitchUser.display_name);
      redirectParams.set("twitchId", twitchUser.id);
    } else {
      redirectParams.set("twitchLinked", false);
    }

    const redirectBase = CLIENT_URL;

    res.redirect(`${redirectBase}/twitch-drops?${redirectParams.toString()}`);
  } catch (err) {
    console.error(
      "Steam oturum hatası detay:",
      err.response?.data || err.message
    );
    res.redirect(`${CLIENT_URL}/drops`);
  }
};

export const handleSteamLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Oturum yok edilirken hata:", err);
    }

    const redirectBase = CLIENT_URL;
    res.redirect(`${redirectBase}/drops`);
  });
};
