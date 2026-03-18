const { z } = require("zod");

const emailSchema = z.string().email();
const phoneSchema = z
  .string()
  .min(8)
  .max(20)
  .regex(/^[0-9+ -]+$/, "Invalid phone");

const registerSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    password: z.string().min(8).max(72),
    displayName: z.string().min(2).max(60)
  })
  .refine((v) => v.email || v.phone, { message: "email or phone is required" });

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(72)
});

const requestOtpSchema = z.object({
  phone: phoneSchema
});

const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().regex(/^[0-9]{6}$/)
});

module.exports = { registerSchema, loginSchema, requestOtpSchema, verifyOtpSchema };

