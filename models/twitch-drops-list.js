import { Schema, model } from "mongoose";
import Joi from "joi";

const twitchDropsListSchema = new Schema({
  dropId: {
    type: String,
    required: true,
  },
  rewardName: {
    type: String,
    required: true,
  },
});

const validateTwitchDropsList = (data) => {
  const schema = Joi.object({
    dropId: Joi.string().required().messages({
      "string.base": "Drop ID must be a valid string!",
      "string.empty": "Drop ID cannot be empty!",
      "any.required": "Drop ID is required!",
    }),
    rewardName: Joi.string().required().messages({
      "string.base": "Reward name must be a valid string!",
      "string.empty": "Reward name cannot be empty!",
      "any.required": "Reward name is required!",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

const TwitchDropsList = model("TwitchDropsList", twitchDropsListSchema);

export { TwitchDropsList, validateTwitchDropsList };
