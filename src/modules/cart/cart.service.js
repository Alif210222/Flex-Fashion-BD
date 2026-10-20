
import mongoose from "mongoose";
import Cart from "./cart.model.js";
import Product from "../product/product.model.js";
import AppError from "../../utils/AppError.js";

const MAX_QUANTITY_PER_VARIANT = 20;

async function getOrCreateCart(customerId, session) {
  let cart = await Cart.findOne({ customer: customerId }).session(session);

  if (!cart) {
    cart = new Cart({
      customer: customerId,
      items: [],
    });

    await cart.save({ session });
  }

  return cart;
}

async function getAvailableProduct(productId, session) {
  const product = await Product.findOne({
    _id: productId,
    status: "active",
  }).session(session);

  if (!product) {
    throw new AppError("Product not found or is not available.", 404);
  }

  return product;
}

function getVariant(product, sku) {
  const variant = product.variants.find((item) => item.sku === sku);

  if (!variant) {
    throw new AppError(
      "The selected size/color variant does not exist.",
      404
    );
  }

  return variant;
}

function assertAvailableQuantity(variant, quantity) {
  if (variant.stock < quantity) {
    throw new AppError(
      `Only ${variant.stock} item(s) are currently available for SKU ${variant.sku}.`,
      409
    );
  }
}

async function runCartTransaction(work) {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await work(session);
    });

    return result;
  } catch (error) {
    // Two simultaneous first requests may both try to create the
    // unique customer cart. The caller can retry this request.
    if (error?.code === 11000) {
      throw new AppError(
        "Your cart was updated by another request. Please try again.",
        409
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

function toCartResponse(cart, products) {
  const productMap = new Map(
    products.map((product) => [product._id.toString(), product])
  );

  const items = cart.items.map((item) => {
    const product = productMap.get(item.product.toString());

    // Products may be deleted or archived after entering the cart.
    if (!product || product.status !== "active") {
      return {
        productId: item.product,
        variantSku: item.variantSku,
        quantity: item.quantity,
        available: false,
        message: "This product is no longer available.",
        unitPrice: null,
        lineTotal: null,
      };
    }

    const variant = product.variants.find(
      (entry) => entry.sku === item.variantSku
    );

    if (!variant) {
      return {
        productId: product._id,
        productName: product.name,
        variantSku: item.variantSku,
        quantity: item.quantity,
        available: false,
        message: "This variant is no longer available.",
        unitPrice: product.price,
        lineTotal: product.price * item.quantity,
      };
    }

    return {
      productId: product._id,
      productName: product.name,
      slug: product.slug,
      image: product.images?.[0]?.url ?? "",
      variantSku: variant.sku,
      size: variant.size,
      color: variant.color,
      colorHex: variant.colorHex,
      quantity: item.quantity,
      stock: variant.stock,
      available: variant.stock >= item.quantity,
      unitPrice: product.price,
      lineTotal: product.price * item.quantity,
    };
  });

  const subtotal = items.reduce(
    (total, item) => total + (item.lineTotal ?? 0),
    0
  );

  const unavailableItems = items.filter(
    (item) => !item.available
  ).length;

  return {
    id: cart._id,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal,
    currency: "BDT",
    unavailableItems,
    canCheckout: items.length > 0 && unavailableItems === 0,
    updatedAt: cart.updatedAt,
  };
}

async function buildCartResponse(cart) {
  const productIds = [
    ...new Set(cart.items.map((item) => item.product.toString())),
  ];

  const products = await Product.find({
    _id: { $in: productIds },
  })
    .select("name slug price images variants status")
    .lean();

  return toCartResponse(cart, products);
}

export async function getCart(customerId) {
  let cart = await Cart.findOne({ customer: customerId }).lean();

  if (!cart) {
    return {
      items: [],
      itemCount: 0,
      subtotal: 0,
      currency: "BDT",
      unavailableItems: 0,
      canCheckout: false,
    };
  }

  return buildCartResponse(cart);
}

export async function addCartItem(customerId, data) {
  await runCartTransaction(async (session) => {
    const product = await getAvailableProduct(data.productId, session);
    const variant = getVariant(product, data.variantSku);

    const cart = await getOrCreateCart(customerId, session);

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === product._id.toString() &&
        item.variantSku === variant.sku
    );

    const nextQuantity =
      (existingItem?.quantity ?? 0) + data.quantity;

    if (nextQuantity > MAX_QUANTITY_PER_VARIANT) {
      throw new AppError(
        `You can add a maximum of ${MAX_QUANTITY_PER_VARIANT} items per variant.`,
        400
      );
    }

    assertAvailableQuantity(variant, nextQuantity);

    if (existingItem) {
      existingItem.quantity = nextQuantity;
    } else {
      cart.items.push({
        product: product._id,
        variantSku: variant.sku,
        quantity: data.quantity,
      });
    }

    await cart.save({ session });
  });

  return getCart(customerId);
}

export async function updateCartItem(customerId, sku, quantity) {
  await runCartTransaction(async (session) => {
    const cart = await Cart.findOne({ customer: customerId }).session(session);

    if (!cart) {
      throw new AppError("Cart not found.", 404);
    }

    const item = cart.items.find((entry) => entry.variantSku === sku);

    if (!item) {
      throw new AppError("Cart item not found.", 404);
    }

    const product = await getAvailableProduct(item.product, session);
    const variant = getVariant(product, sku);

    assertAvailableQuantity(variant, quantity);

    item.quantity = quantity;

    await cart.save({ session });
  });

  return getCart(customerId);
}

export async function removeCartItem(customerId, sku) {
  await runCartTransaction(async (session) => {
    const cart = await Cart.findOne({ customer: customerId }).session(session);

    if (!cart) {
      throw new AppError("Cart not found.", 404);
    }

    const originalLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) => item.variantSku !== sku
    );

    if (cart.items.length === originalLength) {
      throw new AppError("Cart item not found.", 404);
    }

    await cart.save({ session });
  });

  return getCart(customerId);
}

export async function clearCart(customerId) {
  await runCartTransaction(async (session) => {
    const cart = await Cart.findOne({ customer: customerId }).session(session);

    if (!cart) {
      return;
    }

    cart.items = [];
    await cart.save({ session });
  });

  return getCart(customerId);
}
