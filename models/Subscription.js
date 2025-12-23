import { Schema, model } from "mongoose";
import Joi from "joi";

const subscriptionSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

const validateSubscription = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.base": "Email must be a valid string!",
      "string.empty": "Email address cannot be empty!",
      "string.email": "Please provide a valid email address!",
      "any.required": "Email address is required!",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

const Subscription = model("Subscription", subscriptionSchema);

export { Subscription, validateSubscription };
