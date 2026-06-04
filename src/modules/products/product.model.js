import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
      enum: {
        values: ["Visual Art", "Craft & Handmade", "Music & Sound"],
        message: "{VALUE} Not the right category",
      },
    },
    name: { type: String, required: true, trim: true, index: true },
    cartName: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    tags: [{ type: String }],
    description: [{ type: String }],
    fromArtist: [{ type: String }],
    images: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    quantity: { type: Number },
  },
  {
    timestamps: true,
  },
);

export const Product = mongoose.model("Product", productSchema);
