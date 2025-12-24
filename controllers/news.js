import mongoose from "mongoose";

import { News, validateNews } from "../models/news.js";

export const getAllNews = async (req, res) => {
  try {
    const allNews = await News.find();

    if (!allNews.length) {
      return res.status(204).json({ message: "No news items were found!" });
    }

    res.status(200).json(allNews);
  } catch (error) {
    console.error(
      "An error occurred while fetching all news items:",
      error.message
    );
    res.status(500).json({ message: "An internal server error occurred!" });
  }
};

export const createNews = async (req, res) => {
  const { error, value } = validateNews(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details.map((detail) => detail.message),
    });
  }

  try {
    const news = await News.create(value);
    res.status(201).json(news);
  } catch (error) {
    console.error(
      "An error occurred while creating a news item:",
      error.message
    );
    res.status(500).json({ message: "An internal server error occurred!" });
  }
};

export const getNewsById = async (req, res) => {
  const { _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Invalid news identifier!" });
  }

  try {
    const news = await News.findById(_id);

    if (!news) {
      return res
        .status(404)
        .json({ message: "The requested news item was not found!" });
    }

    res.status(200).json(news);
  } catch (error) {
    console.error(
      "An error occurred while fetching the news item by ID:",
      error.message
    );
    res.status(500).json({ message: "An internal server error occurred!" });
  }
};
