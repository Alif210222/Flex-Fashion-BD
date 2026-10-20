
import catchAsync from "../../utils/catchAsync.js";
import * as cartService from "./cart.service.js";

export const getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);

  res.status(200).json({
    success: true,
    message: "Cart retrieved successfully.",
    data: { cart },
  });
});

export const addCartItem = catchAsync(async (req, res) => {
  const cart = await cartService.addCartItem(
    req.user._id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Item added to cart successfully.",
    data: { cart },
  });
});

export const updateCartItem = catchAsync(async (req, res) => {
  const cart = await cartService.updateCartItem(
    req.user._id,
    req.params.sku,
    req.body.quantity
  );

  res.status(200).json({
    success: true,
    message: "Cart quantity updated successfully.",
    data: { cart },
  });
});

export const removeCartItem = catchAsync(async (req, res) => {
  const cart = await cartService.removeCartItem(
    req.user._id,
    req.params.sku
  );

  res.status(200).json({
    success: true,
    message: "Item removed from cart successfully.",
    data: { cart },
  });
});

export const clearCart = catchAsync(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);

  res.status(200).json({
    success: true,
    message: "Cart cleared successfully.",
    data: { cart },
  });
});
