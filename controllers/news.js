import mongoose from "mongoose";

import { News, validateNews } from "../models/News.js";

export const getAllNews = async (req, res) => {
  try {
    const allNews = await News.find();

    if (allNews.length === 0)
      return res
        .status(204)
        .json({ message: "Herhangi bir haber bulunamadı!" });

    res.status(200).json(allNews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Sunucu hatası meydana geldi!" });
  }
};

export const createNews = async (req, res) => {
  const { error, value } = validateNews(req.body);

  if (error)
    return res
      .status(400)
      .json({ message: error.details.map((detail) => detail.message) });

  try {
    const news = await News.create(value);

    res.status(201).json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Sunucu hatası meydana geldi!" });
  }
};

export const getNewsById = async (req, res) => {
  const { _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id))
    return res.status(400).json({ message: "Geçersiz haber kimliği!" });

  try {
    const news = await News.findById(_id);

    if (!news)
      return res.status(400).json({ message: "Böyle bir haber bulunamadı!" });

    res.status(200).json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Sunucu hatası meydana geldi!" });
  }
};
