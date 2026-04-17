export type Role = 'USER' | 'ADMIN' | 'B2B';

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
  companyName?: string;
  taxId?: string;
  isB2BApproved: boolean;
  createdAt: string;
  updatedAt: string;
  addresses?: Address[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  height?: number;
  width?: number;
  length?: number;
  longDescription?: string;
  categoryId?: string;
  category?: Category;
  createdAt: string;
  updatedAt: string;
  variants?: Variant[];
  discountPrice?: number;
  discounts?: Discount[];
  b2bPrices?: B2BPrice[];
  isB2BOnly?: boolean;
}

export interface B2BPrice {
  id: string;
  productId: string;
  minQuantity: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: any; // Json type in Prisma, using any for now or strictly typed if structure is known
  recoveryEmailSent?: boolean;
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

export interface Collection {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  slug: string;
  products?: Product[];
  createdAt: string;
  updatedAt: string;
  discounts?: Discount[];
}

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface Discount {
  id: string;
  name: string;
  code?: string;
  type: DiscountType;
  value: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  products?: Product[];
  collections?: Collection[];
  createdAt: string;
  updatedAt: string;
}

export interface ShippingRate {
  id: string;
  country: string;
  state?: string;
  city?: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}
