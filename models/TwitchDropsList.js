import { Schema, model } from "mongoose";

const twitchDropsListSchema = new Schema({
  dropId: {
    type: String,
    required: true,
  },
  rewardName: {
    type: String,
    required: true,
  },
  dropType: {
    type: Number,
    default: 1,
  },
});

export default model("TwitchDropsList", twitchDropsListSchema);
