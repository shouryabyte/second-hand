const { z } = require("zod");

const categoryEnum = z.enum([
  "Electronics",
  "Furniture",
  "Books",
  "Vehicles",
  "Clothes",
  "Gadgets",
  "Appliances",
  "Other"
]);

const conditionEnum = z.enum(["new", "like_new", "used"]);

const createListingSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  price: z.coerce.number().nonnegative(),
  currency: z.string().min(3).max(6).optional(),
  category: categoryEnum,
  condition: conditionEnum.optional(),
  city: z.string().min(2).max(80).optional(),
  state: z.string().min(2).max(80).optional(),
  country: z.string().min(2).max(80).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional()
});

const listQuerySchema = z.object({
  q: z.string().min(1).max(120).optional(),
  category: categoryEnum.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  city: z.string().min(1).max(80).optional(),
  state: z.string().min(1).max(80).optional(),
  country: z.string().min(1).max(80).optional(),
  sellerId: z.string().min(1).optional(),
  sort: z.enum(["recent", "price_asc", "price_desc"]).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional()
});

module.exports = { createListingSchema, listQuerySchema, categoryEnum, conditionEnum };
