
import catchAsync from "../../utils/catchAsync.js";
import * as orderService from "./order.service.js";

export const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(
    req.user._id,
    req.body
  );

  res.status(201).json({
    success: true,
    message: "Order placed successfully.",
    data: { order },
  });
});

export const getMyOrders = catchAsync(async (req, res) => {
  const result = await orderService.getMyOrders(
    req.user._id,
    req.validatedQuery ?? req.query
  );

  res.status(200).json({
    success: true,
    message: "Your orders retrieved successfully.",
    data: result,
  });
});

export const getMyOrderById = catchAsync(async (req, res) => {
  const order = await orderService.getMyOrderById(
    req.user._id,
    req.params.id
  );

  res.status(200).json({
    success: true,
    data: { order },
  });
});

export const cancelMyOrder = catchAsync(async (req, res) => {
  const order = await orderService.cancelMyOrder(
    req.user._id,
    req.params.id
  );

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully.",
    data: { order },
  });
});

export const getAllOrders = catchAsync(async (req, res) => {
  const result = await orderService.getAllOrders(
    req.validatedQuery ?? req.query
  );

  res.status(200).json({
    success: true,
    message: "Orders retrieved successfully.",
    data: result,
  });
});

export const getAdminOrderById = catchAsync(async (req, res) => {
  const order = await orderService.getAdminOrderById(req.params.id);

  res.status(200).json({
    success: true,
    data: { order },
  });
});

export const updateOrderStatus = catchAsync(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.user._id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Order status updated successfully.",
    data: { order },
  });
});
