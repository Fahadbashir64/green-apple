import { z } from "zod";

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(6),
    email: z.string().email().optional(),
    address: z.string().optional(),
  }),
  paymentMethod: z.enum(["cod", "paypal"]),
  fulfillmentType: z.enum(["delivery", "pickup"]),
  deliveryAreaId: z.number().int().positive().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.number().int().positive().optional(),
        itemName: z.string().min(1),
        sizeLabel: z.enum(["small", "medium", "large", "xlarge"]).optional(),
        unitPrice: z.number().nonnegative(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

const deliveryAreaCreateSchema = z.object({
  city: z.string().trim().min(1).max(80),
  area: z.string().trim().min(1).max(120),
  charge: z.number().nonnegative(),
  isActive: z.boolean().optional()
});

const deliveryAreaUpdateSchema = z.object({
  city: z.string().trim().min(1).max(80).optional(),
  area: z.string().trim().min(1).max(120).optional(),
  charge: z.number().nonnegative().optional(),
  isActive: z.boolean().optional()
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "preparing", "delivered"]),
});

export { deliveryAreaCreateSchema, deliveryAreaUpdateSchema, orderSchema, updateOrderStatusSchema };
