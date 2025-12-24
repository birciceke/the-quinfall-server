import { Subscription, validateSubscription } from "../models/Subscription.js";

export const createNewsletterSubscription = async (req, res) => {
  const { error, value } = validateSubscription(req.body);

  if (error)
    return res
      .status(400)
      .json({ message: error.details.map((detail) => detail.message) });

  try {
    const existingEmail = await Subscription.findOne({ email: value.email });

    if (existingEmail)
      return res.status(400).json({
        message: "This email address is already subscribed to the newsletter!",
      });

    const newSubscription = await Subscription.create(value);

    res.status(201).json(newSubscription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "A server error occured!" });
  }
};
