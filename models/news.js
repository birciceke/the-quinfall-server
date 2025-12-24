import { Schema, model } from "mongoose";
import Joi from "joi";

const newsSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 256,
    },
    content: {
      type: String,
      required: true,
      minLength: 3,
    },
    imageUrl: {
      type: String,
      default:
        "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2294660/capsule_616x353.jpg?t=1740799193",
    },
    category: {
      type: String,
      required: true,
      enum: ["Update", "Community", "Event", "Other"],
    },
  },
  { timestamps: true }
);

const validateNews = (data) => {
  const schema = Joi.object({
    title: Joi.string().required().min(3).max(256).messages({
      "string.base": "Title must be a valid string!",
      "string.empty": "Title cannot be empty!",
      "any.required": "Title is required!",
      "string.min": "Title must be at least {{#limit}} characters long!",
      "string.max": "Title must be at most {{#limit}} characters long!",
    }),
    content: Joi.string().required().min(3).messages({
      "string.base": "Content must be a valid string!",
      "string.empty": "Content cannot be empty!",
      "any.required": "Content is required!",
      "string.min": "Content must be at least {{#limit}} characters long!",
    }),
    imageUrl: Joi.string()
      .default(
        "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2294660/capsule_616x353.jpg?t=1740799193"
      )
      .valid("")
      .messages({
        "string.base": "Image URL must be a valid string!",
      }),
    category: Joi.string()
      .required()
      .valid("Update", "Community", "Event", "Other")
      .messages({
        "string.base": "Category must be a valid string!",
        "string.empty": "Category cannot be empty!",
        "any.required": "Category is required!",
        "any.only": "Category must be a valid value!",
      }),
  });

  return schema.validate(data, { abortEarly: false });
};

const News = model("News", newsSchema);

export { News, validateNews };
