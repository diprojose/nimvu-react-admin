export type Role = 'USER' | 'ADMIN' | 'B2B';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

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
  slug?: string;
  description?: string;
  image?: string;
  order?: number;
  universeId?: string;
  universe?: Universe;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export interface Universe {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  order: number;
  isActive: boolean;
  comingSoon: boolean;
  categories?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  universeId?: string | null;
  universe?: Universe | null;
  image: string;
  mobileImage?: string | null;
  badge?: string | null;
  title: string;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaHref?: string | null;
  textColor?: string | null;
  badgeColor?: string | null;
  titleColor?: string | null;
  subtitleColor?: string | null;
  accentLineColor?: string | null;
  ctaBgColor?: string | null;
  ctaTextColor?: string | null;
  order: number;
  isActive: boolean;
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
  universeId?: string;
  universe?: Universe;
  createdAt: string;
  updatedAt: string;
  variants?: Variant[];
  discountPrice?: number;
  discounts?: Discount[];
  b2bPrices?: B2BPrice[];
  isB2BOnly?: boolean;
  isActive?: boolean;
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
  shippingCarrier?: ShippingCarrier | null;
  trackingNumber?: string | null;
  items?: OrderItem[];
}

export type ShippingCarrier = 'ENVIA' | 'SERVIENTREGA';

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

export type ExpenseCategory =
  | 'FILAMENT'
  | 'PACKAGING'
  | 'ADVERTISING'
  | 'SHIPPING'
  | 'TOOLS'
  | 'MAINTENANCE'
  | 'SOFTWARE'
  | 'OTHER';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
