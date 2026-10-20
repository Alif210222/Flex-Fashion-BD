
import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID");

const variantSkuSchema = z
  .string()
  .trim()
  .min(1, "Variant SKU is required")
  .max(100, "Variant SKU is too long");

export const addCartItemSchema = z.object({
  body: z
    .object({
      productId: objectIdSchema,
      variantSku: variantSkuSchema,
      quantity: z.number().int().min(1).max(20).default(1),
    })
    .strict(),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    sku: variantSkuSchema,
  }),
  body: z
    .object({
      quantity: z.number().int().min(1).max(20),
    })
    .strict(),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    sku: variantSkuSchema,
  }),
});

export const cartParamsSchema = z.object({
  params: z.object({}).strict(),
});
