
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import Order from "./order.model.js";
import Product from "../product/product.model.js";
import AppError from "../../utils/AppError.js";

// Delivery charges are controlled by the backend.
const DELIVERY_CHARGES = {
  "inside-dhaka": 70,
  "outside-dhaka": 130,
};

const ALLOWED_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

function makeOrderNumber() {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  return `FFB-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function getProductImage(product) {
  return product.images?.[0]?.url ?? "";
}

function assertUniqueItems(items) {
  const keys = items.map(
    (item) => `${item.productId}:${item.variantSku}`
  );

  if (new Set(keys).size !== keys.length) {
    throw new AppError(
      "Duplicate product variants are not allowed. Combine their quantities.",
      400
    );
  }
}

function getDeliveryCharge(deliveryLocation) {
  const shippingFee = DELIVERY_CHARGES[deliveryLocation];

  if (shippingFee === undefined) {
    throw new AppError(
      "Please select a valid delivery location: inside-dhaka or outside-dhaka.",
      400
    );
  }

  return shippingFee;
}

async function restoreOrderStock(order, session) {
  for (const item of order.items) {
    const result = await Product.updateOne(
      {
        _id: item.product,
        "variants.sku": item.variantSku,
      },
      {
        $inc: {
          "variants.$.stock": item.quantity,
        },
      },
      { session }
    );

    if (result.matchedCount !== 1) {
      throw new AppError(
        `Could not restore stock for SKU ${item.variantSku}.`,
        409
      );
    }
  }
}

// ============================================
// CREATE ORDER
// ============================================


export async function createOrder(customerId = null, data) {
  assertUniqueItems(data.items);

  // Validate location and calculate delivery charge on the server.
  // Never trust the deliveryCharge sent by the frontend.
  const deliveryLocation = data.deliveryLocation;
  const shippingFee = getDeliveryCharge(deliveryLocation);

  const session = await mongoose.startSession();
  let createdOrder;

  try {
    await session.withTransaction(async () => {
      const orderItems = [];
      let subtotal = 0;

      for (const requestedItem of data.items) {
        const product = await Product.findOne({
          _id: requestedItem.productId,
          status: "active",
        }).session(session);

        if (!product) {
          throw new AppError(
            "One of the selected products is unavailable.",
            404
          );
        }

        const variant = product.variants.find(
          (item) => item.sku === requestedItem.variantSku
        );

        if (!variant) {
          throw new AppError(
            `Selected variant not found for ${product.name}.`,
            400
          );
        }

        if (variant.stock < requestedItem.quantity) {
          throw new AppError(
            `Insufficient stock for ${product.name} (${variant.sku}).`,
            409
          );
        }

        // Reserve stock atomically.
        // The stock condition prevents overselling.
        const stockUpdate = await Product.updateOne(
          {
            _id: product._id,
            status: "active",
            variants: {
              $elemMatch: {
                sku: variant.sku,
                stock: { $gte: requestedItem.quantity },
              },
            },
          },
          {
            $inc: {
              "variants.$.stock": -requestedItem.quantity,
            },
          },
          { session }
        );

        if (stockUpdate.modifiedCount !== 1) {
          throw new AppError(
            `Stock changed while ordering ${product.name}. Please try again.`,
            409
          );
        }

        // Always calculate product prices from the database.
        const unitPrice = product.price;
        const lineTotal = unitPrice * requestedItem.quantity;

        subtotal += lineTotal;

        orderItems.push({
          product: product._id,
          productName: product.name,
          slug: product.slug,
          image: getProductImage(product),
          variantSku: variant.sku,
          size: variant.size,
          color: variant.color,
          quantity: requestedItem.quantity,
          unitPrice,
          lineTotal,
        });
      }

      // Calculate final total on the backend.
      const totalAmount = subtotal + shippingFee;

      const [order] = await Order.create(
        [
          {
            orderNumber: makeOrderNumber(),

            // Registered customer: User ID
            // Guest customer: null
            customer: customerId ?? null,

            items: orderItems,

            shippingAddress: data.shippingAddress,

            // Delivery information
            deliveryLocation,
            shippingFee,

            paymentMethod: "cod",
            paymentStatus: "unpaid",
            orderStatus: "pending",

            subtotal,
            totalAmount,

            trackingHistory: [
              {
                status: "pending",
                note: "Order placed successfully.",

                // Guest order: null
                // Registered customer order: User ID
                updatedBy: customerId ?? null,
              },
            ],
          },
        ],
        { session }
      );

      createdOrder = order;
    });

    return createdOrder;
  } finally {
    await session.endSession();
  }
}


// ============================================
// GET MY ORDERS
// ============================================

export async function getMyOrders(customerId, query) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  const filter = { customer: customerId };

  if (query.orderStatus) {
    filter.orderStatus = query.orderStatus;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// GET MY ORDER BY ID
// ============================================

export async function getMyOrderById(customerId, orderId) {
  const order = await Order.findOne({
    _id: orderId,
    customer: customerId,
  }).lean();

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  return order;
}

// ============================================
// GET ALL ORDERS (ADMIN)
// ============================================

export async function getAllOrders(query) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  const filter = {};

  if (query.orderStatus) {
    filter.orderStatus = query.orderStatus;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// GET SINGLE ORDER (ADMIN)
// ============================================

export async function getAdminOrderById(orderId) {
  const order = await Order.findById(orderId)
    .populate("customer", "name email phone")
    .lean();

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  return order;
}

// ============================================
// UPDATE ORDER STATUS (ADMIN)
// ============================================

export async function updateOrderStatus(
  orderId,
  adminId,
  { orderStatus, note, paymentStatus }
) {
  const session = await mongoose.startSession();
  let updatedOrder;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        throw new AppError("Order not found.", 404);
      }

      const allowed = ALLOWED_TRANSITIONS[order.orderStatus] ?? [];

      if (!allowed.includes(orderStatus)) {
        throw new AppError(
          `Cannot change order status from ${order.orderStatus} to ${orderStatus}.`,
          400
        );
      }

      if (orderStatus === "cancelled") {
        await restoreOrderStock(order, session);
        order.cancelledAt = new Date();
      }

      if (orderStatus === "delivered") {
        order.deliveredAt = new Date();

        // COD orders should be marked paid only when the admin confirms
        // that payment was collected.
        if (paymentStatus !== "paid") {
          throw new AppError(
            "Set paymentStatus to paid when confirming COD collection.",
            400
          );
        }
      }

      if (paymentStatus) {
        if (
          paymentStatus === "refunded" &&
          order.paymentStatus !== "paid"
        ) {
          throw new AppError(
            "Only a paid order can be marked as refunded.",
            400
          );
        }

        if (
          paymentStatus === "paid" &&
          order.orderStatus !== "delivered" &&
          orderStatus !== "delivered"
        ) {
          throw new AppError(
            "COD payment can be marked paid when the order is delivered.",
            400
          );
        }

        order.paymentStatus = paymentStatus;
      }

      order.orderStatus = orderStatus;

      order.trackingHistory.push({
        status: orderStatus,
        note: note || "",
        updatedBy: adminId,
        updatedAt: new Date(),
      });

      await order.save({ session });

      updatedOrder = order;
    });

    return updatedOrder;
  } finally {
    await session.endSession();
  }
}

// ============================================
// CANCEL MY ORDER (CUSTOMER)
// ============================================

export async function cancelMyOrder(customerId, orderId) {
  const session = await mongoose.startSession();
  let cancelledOrder;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: orderId,
        customer: customerId,
      }).session(session);

      if (!order) {
        throw new AppError("Order not found.", 404);
      }

      if (!["pending", "confirmed"].includes(order.orderStatus)) {
        throw new AppError(
          "This order can no longer be cancelled by the customer.",
          400
        );
      }

      await restoreOrderStock(order, session);

      order.orderStatus = "cancelled";
      order.cancelledAt = new Date();

      order.trackingHistory.push({
        status: "cancelled",
        note: "Cancelled by customer.",
        updatedBy: customerId,
      });

      await order.save({ session });

      cancelledOrder = order;
    });

    return cancelledOrder;
  } finally {
    await session.endSession();
  }
}
