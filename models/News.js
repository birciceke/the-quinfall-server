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
      minLength: 12,
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
      "string.base": "Başlık bir metin olmalıdır!",
      "string.empty": "Başlık boş bırakılamaz!",
      "any.required": "Başlık zorunludur!",
      "string.min": "Başlık en az {{#limit}} karakter olmalıdır!",
      "string.max": "Başlık en fazla {{#limit}} karakter olabilir!",
    }),
    content: Joi.string().required().min(3).messages({
      "string.base": "İçerik bir metin olmalıdır!",
      "string.empty": "İçerik boş bırakılamaz!",
      "any.required": "İçerik zorunludur!",
      "string.min": "İçerik en az {{#limit}} karakter olmalıdır!",
    }),
    imageUrl: Joi.string()
      .default(
        "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2294660/capsule_616x353.jpg?t=1740799193"
      )
      .valid("")
      .messages({
        "string.base": "Görsel bağlantısı bir metin olmalıdır!",
      }),
    category: Joi.string()
      .required()
      .valid("Update", "Community", "Event", "Other")
      .messages({
        "string.base": "Kategori bir metin olmalıdır!",
        "string.empty": "Kategori boş bırakılamaz!",
        "any.required": "Kategori zorunludur!",
        "any.only": "Kategori geçerli bir değer olmalıdır!",
      }),
  });

  return schema.validate(data, { abortEarly: false });
};

const News = model("News", newsSchema);

export { News, validateNews };
