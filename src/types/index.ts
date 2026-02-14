export type Role = 'USER' | 'ADMIN';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  addresses?: Address[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
  variants?: Variant[];
}

export interface Variant {
  id: string;
  productId: string;
  name: string;
  stock: number;
  price?: number;
  images: string[];
  sku: string;
}

export interface Order {
  id: string;
  userId: string;
  user?: User;
  status: OrderStatus;
  total: number;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: any; // Json type in Prisma, using any for now or strictly typed if structure is known
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  variantId?: string;
  variant?: Variant;
}
