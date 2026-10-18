import mongoose from "mongoose";
import slugify from "slugify";

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
  },
  { _id: true }
);

const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    colorHex: {
      type: String,
      default: "#000000",
      match: /^#[0-9A-Fa-f]{6}$/,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 160,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },

    brand: {
      type: String,
      default: "Flex-Fashion BD",
      trim: true,
      maxlength: 100,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "t-shirts",
        "hoodies",
        "sweatshirts",
        "shirts",
        "fabrics",
        "others",
      ],
    },

    subcategory: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    gender: {
      type: String,
      enum: ["men", "women", "unisex", "kids"],
      default: "unisex",
    },

    material: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
    },

    fabricWeightGsm: {
      type: Number,
      min: 0,
      default: null,
    },

    fit: {
      type: String,
      enum: [
        "regular",
        "oversized",
        "slim",
        "relaxed",
        "other",
      ],
      default: "regular",
    },

    pattern: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    compareAtPrice: {
      type: Number,
      default: null,
      min: 0,
      validate: {
        validator(value) {
          return value == null || value >= this.price;
        },
        message: "Compare-at price must be greater than or equal to price",
      },
    },

    costPrice: {
      type: Number,
      default: null,
      min: 0,
      select: false,
    },

    images: {
      type: [imageSchema],
      validate: {
        validator(images) {
          return images.length >= 1 && images.length <= 8;
        },
        message: "A product must have between 1 and 8 images",
      },
    },

    variants: {
      type: [variantSchema],
      required: true,
      validate: {
        validator(variants) {
          return variants.length >= 1 && variants.length <= 100;
        },
        message: "A product must have between 1 and 100 variants",
      },
    },

    careInstructions: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

productSchema.index({
  name: "text",
  description: "text",
  tags: "text",
});

productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

productSchema.pre("validate", function () {
  if (this.isNew && !this.slug && this.name) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true,
    });
  }

  if (this.status === "active" && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  if (this.status !== "active") {
    this.publishedAt = null;
  }
});

const Product = mongoose.model("Product", productSchema);

export default Product;