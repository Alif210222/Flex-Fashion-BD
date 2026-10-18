import * as productService from "./product.service.js";
import catchAsync from "../../utils/catchAsync.js";

export const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(
    req.body,
    req.files,
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: { 
       product: publicProduct(product)
     },
  });
});

// prevent the cost-price from create response
const publicProduct = (product) => {
  const data = product.toObject
    ? product.toObject()
    : { ...product };

  delete data.costPrice;

  return data;
};

export const getProducts = catchAsync(async (req, res) => {
  const result = await productService.getProducts(
    req.validatedQuery || req.query,
    false
  );

  res.status(200).json({
    success: true,
    message: "Products retrieved successfully",
    data: result,
  });
});

export const getAdminProducts = catchAsync(async (req, res) => {
  const result = await productService.getProducts(
    req.validatedQuery || req.query,
    true
  );

  res.status(200).json({
    success: true,
    message: "Admin products retrieved successfully",
    data: result,
  });
});

export const getProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = /^[0-9a-fA-F]{24}$/.test(id)
    ? await productService.getProductById(id, false)
    : await productService.getProductBySlug(id, false);

  res.status(200).json({
    success: true,
    message: "Product retrieved successfully",
    data: { product },
  });
});

export const getAdminProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = /^[0-9a-fA-F]{24}$/.test(id)
    ? await productService.getProductById(id, true)
    : await productService.getProductBySlug(id, true);

  res.status(200).json({
    success: true,
    message: "Product retrieved successfully",
    data: { product },
  });
});

export const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(
    req.params.id,
    req.body,
    req.files
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: { product },
  });
});

export const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProduct(req.params.id);

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});