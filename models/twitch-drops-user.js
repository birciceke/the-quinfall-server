import { Schema, model } from "mongoose";

const twitchDropsUserSchema = new Schema(
  {
    steamId: {
      type: String,
      index: true,
      default: null,
    },
    twitchId: {
      type: String,
      index: true,
      required: true,
    },
    drops: {
      type: [String],
      default: [],
    },
    serverEU: {
      type: Number,
      default: 1,
    },
    serverNA: {
      type: Number,
      default: 1,
    },
    serverASIA: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

export default model("TwitchDropsUser", twitchDropsUserSchema);
