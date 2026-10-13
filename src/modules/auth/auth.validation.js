import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must not exceed 72 characters");

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254),
    password: passwordSchema,
  }).strict(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(72),
  }).strict(),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().max(25).optional(),
    address: z.string().trim().max(300).optional(),
  }).strict().refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update"
  ),
});