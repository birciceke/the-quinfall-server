import mongoose from "mongoose";

const TwitchDropsUsersSchema = new mongoose.Schema({
  steamId: { type: String, index: true, default: null },
  twitchId: { type: String, index: true, required: true },
  drops: { type: [String], default: [] },
  serverEU: { type: Number, default: 1 },
  serverNA: { type: Number, default: 1 },
  serverASIA: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now },
});

TwitchDropsUsersSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("TwitchDropsUsers", TwitchDropsUsersSchema);
