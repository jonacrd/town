import { z } from 'zod';

// Esquemas base reutilizables
export const phoneNumberSchema = z.string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format')
  .min(10, 'Phone number too short')
  .max(15, 'Phone number too long');

export const paginationSchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(parseInt(val, 10), 100) : 10),
  offset: z.string().optional().transform((val) => val ? parseInt(val, 10) : 0),
});

export const idSchema = z.string().min(1, 'ID is required');

// Esquemas para productos
export const createProductSchema = {
  body: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must be less than 200 characters')
      .trim(),
    description: z.string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
    priceCents: z.number()
      .int('Price must be an integer')
      .positive('Price must be positive')
      .max(999999999, 'Price too high'), // $9,999,999.99 max
    stock: z.number()
      .int('Stock must be an integer')
      .min(0, 'Stock cannot be negative')
      .max(999999, 'Stock too high'),
    imageUrl: z.string()
      .url('Invalid image URL')
      .optional()
      .or(z.literal('')),
    category: z.string()
      .min(1, 'Category is required')
      .max(50, 'Category too long')
      .optional(),
    active: z.boolean().optional().default(true),
  }),
};

export const updateProductSchema = {
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must be less than 200 characters')
      .trim()
      .optional(),
    description: z.string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
    priceCents: z.number()
      .int('Price must be an integer')
      .positive('Price must be positive')
      .max(999999999, 'Price too high')
      .optional(),
    stock: z.number()
      .int('Stock must be an integer')
      .min(0, 'Stock cannot be negative')
      .max(999999, 'Stock too high')
      .optional(),
    imageUrl: z.string()
      .url('Invalid image URL')
      .optional()
      .or(z.literal('')),
    category: z.string()
      .min(1, 'Category is required')
      .max(50, 'Category too long')
      .optional(),
    active: z.boolean().optional(),
  }),
};

export const getProductsSchema = {
  query: z.object({
    query: z.string().optional(),
    category: z.string().optional(),
    active: z.string()
      .optional()
      .transform((val) => val === 'true'),
    minPrice: z.string()
      .optional()
      .transform((val) => val ? parseInt(val, 10) : undefined),
    maxPrice: z.string()
      .optional()
      .transform((val) => val ? parseInt(val, 10) : undefined),
    ...paginationSchema.shape,
  }),
};

export const getProductSchema = {
  params: z.object({
    id: idSchema,
  }),
};

export const deleteProductSchema = {
  params: z.object({
    id: idSchema,
  }),
};

// Esquemas para órdenes
export const createOrderSchema = {
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    items: z.array(z.object({
      productId: z.string().min(1, 'Product ID is required'),
      qty: z.number()
        .int('Quantity must be an integer')
        .positive('Quantity must be positive')
        .max(999, 'Quantity too high'),
    })).min(1, 'At least one item is required').max(50, 'Too many items'),
    payment: z.enum(['CASH', 'TRANSFER'], {
      required_error: 'Payment method is required',
      invalid_type_error: 'Invalid payment method',
    }),
    address: z.string()
      .max(500, 'Address too long')
      .optional(),
    note: z.string()
      .max(500, 'Note too long')
      .optional(),
  }),
};

export const getOrdersSchema = {
  query: z.object({
    status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'DELIVERED']).optional(),
    userId: z.string().optional(),
    payment: z.enum(['CASH', 'TRANSFER']).optional(),
    ...paginationSchema.shape,
  }),
};

export const getOrderSchema = {
  params: z.object({
    id: idSchema,
  }),
};

export const updateOrderSchema = {
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'DELIVERED']).optional(),
    note: z.string().max(500, 'Note too long').optional(),
  }),
};

// Esquemas para WhatsApp webhook
export const whatsappWebhookSchema = {
  body: z.object({
    // Meta WhatsApp webhook format
    object: z.string().optional(),
    entry: z.array(z.object({
      id: z.string(),
      changes: z.array(z.object({
        value: z.object({
          messaging_product: z.string().optional(),
          metadata: z.object({
            display_phone_number: z.string(),
            phone_number_id: z.string(),
          }).optional(),
          contacts: z.array(z.object({
            profile: z.object({
              name: z.string(),
            }),
            wa_id: z.string(),
          })).optional(),
          messages: z.array(z.object({
            from: z.string(),
            id: z.string(),
            timestamp: z.string(),
            text: z.object({
              body: z.string(),
            }).optional(),
            type: z.string(),
          })).optional(),
        }),
        field: z.string(),
      })),
    })).optional(),
    
    // Twilio webhook format (alternativo)
    From: z.string().optional(),
    To: z.string().optional(),
    Body: z.string().optional(),
    MessageSid: z.string().optional(),
    AccountSid: z.string().optional(),
  }).refine(
    (data) => {
      // Debe tener formato Meta o Twilio
      return (data.object && data.entry) || (data.From && data.Body);
    },
    {
      message: 'Invalid webhook format. Must be Meta or Twilio format.',
    }
  ),
};

export const whatsappVerifySchema = {
  query: z.object({
    'hub.mode': z.string(),
    'hub.challenge': z.string(),
    'hub.verify_token': z.string(),
  }),
};

// Esquema para broadcast (si se implementa)
export const broadcastSchema = {
  body: z.object({
    message: z.string()
      .min(1, 'Message is required')
      .max(1600, 'Message too long'), // WhatsApp limit
    phoneNumbers: z.array(phoneNumberSchema)
      .min(1, 'At least one phone number required')
      .max(100, 'Too many recipients'),
    templateName: z.string().optional(),
    templateParams: z.array(z.string()).optional(),
  }),
};

// Esquemas para health check
export const healthCheckSchema = {
  query: z.object({
    detailed: z.string()
      .optional()
      .transform((val) => val === 'true'),
  }),
};

// Validadores específicos para diferentes casos de uso
export const validatePhoneNumber = (phone: string): boolean => {
  try {
    phoneNumberSchema.parse(phone);
    return true;
  } catch {
    return false;
  }
};

export const validateEmail = z.string().email('Invalid email format').optional();

export const validateUrl = z.string().url('Invalid URL format').optional();

// Schema para sanitización de inputs de texto
export const sanitizeTextInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover caracteres potencialmente peligrosos
    .substring(0, 1000); // Limitar longitud
};

// Schema para validar archivos de imagen (si se implementa upload)
export const imageFileSchema = z.object({
  mimetype: z.string().refine(
    (type) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type),
    'Invalid image format. Only JPEG, PNG, WebP, and GIF are allowed.'
  ),
  size: z.number().max(5 * 1024 * 1024, 'Image too large. Maximum size is 5MB.'),
});

// Esquemas para autenticación (si se implementa)
export const authSchema = {
  login: z.object({
    phone: phoneNumberSchema,
    code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
  }),
  register: z.object({
    phone: phoneNumberSchema,
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name too long')
      .optional(),
  }),
};

// Helper para validar IDs de Prisma (cuid)
export const validateCuid = z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid ID format');

// Schema para configuración de rate limiting
export const rateLimitConfigSchema = z.object({
  windowMs: z.number().positive(),
  maxRequests: z.number().positive(),
  message: z.string().optional(),
});

// Export de todos los schemas para fácil importación
export const schemas = {
  product: {
    create: createProductSchema,
    update: updateProductSchema,
    get: getProductSchema,
    list: getProductsSchema,
    delete: deleteProductSchema,
  },
  order: {
    create: createOrderSchema,
    update: updateOrderSchema,
    get: getOrderSchema,
    list: getOrdersSchema,
  },
  whatsapp: {
    webhook: whatsappWebhookSchema,
    verify: whatsappVerifySchema,
    broadcast: broadcastSchema,
  },
  health: healthCheckSchema,
  auth: authSchema,
};
