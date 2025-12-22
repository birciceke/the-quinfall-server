import axios from "axios";

let appAccessToken = null;
let expiresAt = 0;

export const getTwitchAppToken = async () => {
  if (appAccessToken && Date.now() < expiresAt) {
    return appAccessToken;
  }

  const response = await axios.post("https://id.twitch.tv/oauth2/token", null, {
    params: {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    },
  });

  appAccessToken = response.data.access_token;
  expiresAt = Date.now() + response.data.expires_in * 1000;

  console.log("Twitch App Access Token başarıyla alındı!");

  return appAccessToken;
};
