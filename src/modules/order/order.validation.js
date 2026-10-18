
import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+?8801|01)[3-9]\d{8}$/, "Enter a valid Bangladesh phone number");

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: phoneSchema,
  alternatePhone: phoneSchema.optional().or(z.literal("")),
  division: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  area: z.string().trim().min(2).max(100),
  addressLine: z.string().trim().min(5).max(300),
  postalCode: z.string().trim().max(20).optional(),
  deliveryNote: z.string().trim().max(300).optional(),
});

export const createOrderSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
          variantSku: z.string().trim().min(1).max(100),
          quantity: z.number().int().min(1).max(20),
        })
      )
      .min(1)
      .max(20),
    shippingAddress: addressSchema,
  }),
});

export const orderIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order ID"),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order ID"),
  }),
  body: z.object({
    orderStatus: z.enum([
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ]),
    note: z.string().trim().max(500).optional(),
    paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
  }),
});

export const orderQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    orderStatus: z
      .enum([
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ])
      .optional(),
  }),
});
