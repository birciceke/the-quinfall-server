import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

let appAccessToken = null;
let expiresAt = 0;

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

export const getTwitchAppToken = async () => {
  if (appAccessToken && Date.now() < expiresAt) {
    return appAccessToken;
  }

  const response = await axios.post("https://id.twitch.tv/oauth2/token", null, {
    params: {
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    },
  });

  appAccessToken = response.data.access_token;
  expiresAt = Date.now() + response.data.expires_in * 1000;

  console.log(
    `Twitch uygulama erişim jetonu başarıyla alındı: ${appAccessToken}`
  );

  return appAccessToken;
};
