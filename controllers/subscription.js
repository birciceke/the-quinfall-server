import { Subscription, validateSubscription } from "../models/subscription.js";

export const createNewsletterSubscription = async (req, res) => {
  const { error, value } = validateSubscription(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details.map((detail) => detail.message),
    });
  }

  try {
    const existingSubscription = await Subscription.findOne({
      email: value.email,
    });

    if (existingSubscription) {
      return res.status(400).json({
        message: "This email address is already subscribed to the newsletter!",
      });
    }

    const newSubscription = await Subscription.create(value);
    res.status(201).json(newSubscription);
  } catch (error) {
    console.error(
      "An error occurred while creating a newsletter subscription: ",
      error.message
    );
    res.status(500).json({ message: "An internal server error occurred!" });
  }
};
