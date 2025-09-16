// API Fetcher utility
const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:4000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class ApiError extends Error {
  public status: number;
  public response?: any;

  constructor(message: string, status: number, response?: any) {
    super(message);
    this.status = status;
    this.response = response;
    this.name = 'ApiError';
  }
}

// Generic fetcher function
async function fetcher<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || `HTTP error! status: ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      'Error de conexión. Verifica tu internet.',
      0,
      error
    );
  }
}

// API methods
export const api = {
  // Products
  products: {
    list: (params?: {
      query?: string;
      category?: string;
      active?: boolean;
      page?: number;
      limit?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.query) searchParams.set('query', params.query);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.active !== undefined) searchParams.set('active', params.active.toString());
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());

      const query = searchParams.toString();
      return fetcher<PaginatedResponse<Product>>(`/api/products${query ? `?${query}` : ''}`);
    },

    create: (data: CreateProductData) => {
      return fetcher<ApiResponse<Product>>('/api/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getById: (id: string) => {
      return fetcher<ApiResponse<Product>>(`/api/products/${id}`);
    },

    update: (id: string, data: Partial<CreateProductData>) => {
      return fetcher<ApiResponse<Product>>(`/api/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: (id: string) => {
      return fetcher<ApiResponse>(`/api/products/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Orders
  orders: {
    list: (params?: {
      status?: string;
      userId?: string;
      page?: number;
      limit?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.userId) searchParams.set('userId', params.userId);
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());

      const query = searchParams.toString();
      return fetcher<PaginatedResponse<Order>>(`/api/orders${query ? `?${query}` : ''}`);
    },

    create: (data: CreateOrderData) => {
      return fetcher<ApiResponse<Order>>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getById: (id: string) => {
      return fetcher<ApiResponse<Order>>(`/api/orders/${id}`);
    },

    updateStatus: (id: string, status: string) => {
      return fetcher<ApiResponse<Order>>(`/api/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
  },

  // Health check
  health: () => {
    return fetcher<ApiResponse>('/health');
  },
};

// Types
export interface Product {
  id: string;
  title: string;
  description?: string;
  priceCents: number;
  stock: number;
  imageUrl?: string;
  category?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    storeName: string;
    tower?: string;
    user: {
      name?: string;
      phone: string;
    };
  };
}

export interface CreateProductData {
  title: string;
  description?: string;
  priceCents: number;
  stock: number;
  imageUrl?: string;
  category?: string;
}

export interface Order {
  id: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'DELIVERED';
  payment: 'CASH' | 'TRANSFER';
  totalCents: number;
  address?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string;
    phone: string;
  };
  items: {
    id: string;
    qty: number;
    priceCents: number;
    product: {
      id: string;
      title: string;
      imageUrl?: string;
      seller: {
        storeName: string;
      };
    };
  }[];
}

export interface CreateOrderData {
  userId: string;
  items: {
    productId: string;
    qty: number;
  }[];
  payment: 'CASH' | 'TRANSFER';
  address?: string;
  note?: string;
}

// Utility functions
export const formatPrice = (cents: number): string => {
  return (cents / 100).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });
};

export const createWhatsAppLink = (phone: string, text: string): string => {
  // Limpiar el número de teléfono (remover espacios, guiones, etc.)
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};

export const createProductWhatsAppText = (product: Product, userAddress?: string): string => {
  const price = formatPrice(product.priceCents);
  let text = `Hola 👋 quiero *${product.title}* a ${price}.`;
  
  if (userAddress) {
    text += ` Mi dirección: ${userAddress}`;
  } else {
    text += ' Mi dirección: [Por favor ingresa tu dirección]';
  }
  
  return text;
};
