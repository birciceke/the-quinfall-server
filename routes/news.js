import express from "express";

import { getAllNews, createNews, getNewsById } from "../controllers/news.js";

const router = express.Router();

router.get("/news", getAllNews);
router.post("/news", createNews);
router.get("/news/:_id", getNewsById);

export default router;
