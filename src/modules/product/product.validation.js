import { z } from "zod";

const parseJsonField = (schema) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }, schema);

const variantSchema = z.object({
  sku: z.string().trim().min(2).max(60),
  size: z.string().trim().min(1).max(30),
  color: z.string().trim().min(1).max(50),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  stock: z.coerce.number().int().min(0).max(1000000),
}).strict();

const productFields = {
  name: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
  brand: z.string().trim().max(100).optional(),
  category: z.enum([
    "t-shirts",
    "hoodies",
    "sweatshirts",
    "shirts",
    "fabrics",
    "others",
  ]),
  subcategory: z.string().trim().max(100).optional(),
  gender: z.enum(["men", "women", "unisex", "kids"]).optional(),
  material: z.string().trim().max(150).optional(),
  fabricWeightGsm: z.preprocess(
    (v) => v === "" || v == null ? undefined : Number(v),
    z.number().min(0).max(2000).optional()
  ),
  fit: z.enum([
    "regular",
    "oversized",
    "slim",
    "relaxed",
    "other",
  ]).optional(),
  pattern: z.string().trim().max(100).optional(),
  price: z.coerce.number().min(0).max(100000000),
  compareAtPrice: z.preprocess(
    (v) => v === "" || v == null ? null : Number(v),
    z.number().min(0).max(100000000).nullable().optional()
  ),
  costPrice: z.preprocess(
    (v) => v === "" || v == null ? undefined : Number(v),
    z.number().min(0).max(100000000).optional()
  ),
  variants: parseJsonField(
    z.array(variantSchema).min(1).max(100)
  ),
  careInstructions: parseJsonField(
    z.array(z.string().trim().min(1).max(200)).max(20)
  ).optional(),
  tags: parseJsonField(
    z.array(z.string().trim().min(1).max(50)).max(30)
  ).optional(),
  isFeatured: z.preprocess(
    (v) => v === "true" ? true : v === "false" ? false : v,
    z.boolean().optional()
  ),
  status: z.enum(["draft", "active", "archived"]).optional(),
};

export const createProductSchema = z.object({
  body: z.object(productFields).strict(),
});

export const updateProductSchema = z.object({
  body: z.object({
    ...Object.fromEntries(
      Object.entries(productFields).map(([key, schema]) => [
        key,
        schema.optional(),
      ])
    ),
    removeImagePublicIds: parseJsonField(
      z.array(z.string().min(1)).max(8)
    ).optional(),
  }).strict().refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update"
  ),
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    category: z.string().optional(),
    search: z.string().trim().max(100).optional(),
    sort: z.enum([
      "newest",
      "oldest",
      "price_asc",
      "price_desc",
    ]).default("newest"),
    status: z.enum(["draft", "active", "archived"]).optional(),
    featured: z.enum(["true", "false"]).optional(),
  }),
});