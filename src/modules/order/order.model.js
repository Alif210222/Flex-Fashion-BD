



import mongoose from "mongoose";

const { Schema, model } = mongoose;

// ==============================
// ORDER ITEM SCHEMA
// ==============================
const orderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    variantSku: {
      type: String,
      required: true,
    },

    size: {
      type: String,
      required: true,
    },

    color: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

// ==============================
// SHIPPING ADDRESS SCHEMA
// ==============================
const shippingAddressSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500,
    },
  },
  { _id: false }
);

// ==============================
// ORDER TRACKING SCHEMA
// ==============================
const trackingSchema = new Schema(
  {
    status: {
      type: String,
      required: true,
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// ==============================
// MAIN ORDER SCHEMA
// ==============================
const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

   customer: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
  index: true,
},

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "An order must contain at least one item.",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // ==============================
    // DELIVERY INFORMATION
    // ==============================

    deliveryLocation: {
      type: String,
      enum: ["inside-dhaka", "outside-dhaka"],
      required: true,
    },

    // ==============================
    // PAYMENT INFORMATION
    // ==============================

    paymentMethod: {
      type: String,
      enum: ["cod"],
      default: "cod",
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },

    // ==============================
    // ORDER STATUS
    // ==============================

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
      index: true,
    },

    // ==============================
    // ORDER PRICE CALCULATION
    // ==============================

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingFee: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==============================
    // ORDER TRACKING
    // ==============================

    trackingHistory: {
      type: [trackingSchema],
      default: [],
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ==============================
// INDEXES
// ==============================

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

// ==============================
// EXPORT MODEL
// ==============================

const Order = model("Order", orderSchema);

export default Order;
