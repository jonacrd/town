// Configuración de API
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';

// Tipos
export interface Product {
  id: string;
  title: string;
  priceCents: number;
  stock: number;
  imageUrl?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalCents: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  priceCents: number;
}

// Cliente API
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Productos
  async getProducts(params?: {
    search?: string;
    category?: string;
    sort?: string;
  }): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.sort) searchParams.set('sort', params.sort);

    const query = searchParams.toString();
    const endpoint = `/api/products${query ? `?${query}` : ''}`;
    
    return this.request<Product[]>(endpoint);
  }

  async getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/api/products/${id}`);
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return this.request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Pedidos
  async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/api/orders');
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}`);
  }

  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    return this.request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient(API_BASE_URL);

// Funciones de utilidad
export const formatPrice = (cents: number): string => {
  return (cents / 100).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Mock data para desarrollo
export const mockProducts: Product[] = [
  {
    id: '1',
    title: 'iPhone 14 Pro Max 256GB',
    priceCents: 450000000,
    stock: 3,
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop',
    category: 'Tecnología',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'MacBook Air M2 13" 512GB',
    priceCents: 520000000,
    stock: 1,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop',
    category: 'Tecnología',
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T15:30:00Z'
  },
  {
    id: '3',
    title: 'Nike Air Force 1 Blancas',
    priceCents: 35000000,
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop',
    category: 'Ropa',
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-13T09:15:00Z'
  },
  {
    id: '4',
    title: 'Cafetera Espresso Delonghi',
    priceCents: 28000000,
    stock: 0,
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop',
    category: 'Hogar',
    createdAt: '2024-01-12T14:20:00Z',
    updatedAt: '2024-01-12T14:20:00Z'
  },
  {
    id: '5',
    title: 'Bicicleta MTB Specialized',
    priceCents: 180000000,
    stock: 2,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
    category: 'Deportes',
    createdAt: '2024-01-11T11:45:00Z',
    updatedAt: '2024-01-11T11:45:00Z'
  },
  {
    id: '6',
    title: 'Libro "El Arte de la Guerra"',
    priceCents: 4500000,
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=300&fit=crop',
    category: 'Libros',
    createdAt: '2024-01-10T16:30:00Z',
    updatedAt: '2024-01-10T16:30:00Z'
  }
];
