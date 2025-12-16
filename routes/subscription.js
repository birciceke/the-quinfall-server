import express from "express";

import { createNewsletterSubscription } from "../controllers/subscription.js";

const router = express.Router();

router.post("/subscription", createNewsletterSubscription);

export default router;
