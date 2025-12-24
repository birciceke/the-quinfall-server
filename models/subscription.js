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
      "string.base": "E-posta bir metin olmalıdır!",
      "string.empty": "E-posta boş bırakılamaz!",
      "string.email": "Lütfen geçerli bir e-posta giriniz!",
      "any.required": "E-posta zorunludur!",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

const Subscription = model("Subscription", subscriptionSchema);

export { Subscription, validateSubscription };
