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
  discountEndDate?: string;
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
  postSaleCases?: PostSaleCase[];
}

export type ShippingCarrier = 'ENVIA' | 'SERVIENTREGA';

// ── Postventa ──────────────────────────────────────────────────────────────

export type PostSaleType =
  | 'TRANSIT_DAMAGE'
  | 'CUSTOMER_DAMAGE'
  | 'EXCHANGE'
  | 'MISSING_ITEM'
  | 'OTHER';

export type PostSaleFault = 'NIMVU' | 'CUSTOMER' | 'UNDEFINED';

/**
 * CUSTOMER_TO_COURIER: el cliente paga el envío, pero directo al domiciliario.
 * Ese dinero nunca entra a la caja de Nimvu y no debe contarse como ingreso.
 */
export type PostSaleShippingPayer =
  | 'NIMVU'
  | 'CUSTOMER_TO_NIMVU'
  | 'CUSTOMER_TO_COURIER';

export type PostSaleStatus =
  | 'OPEN'
  | 'PREPARING'
  | 'SHIPPED'
  | 'RESOLVED'
  | 'CANCELLED';

export interface PostSaleItem {
  id: string;
  caseId: string;
  productId: string;
  product?: Pick<Product, 'id' | 'name' | 'images'>;
  variantName?: string | null;
  fromVariantName?: string | null;
  quantity: number;
  note?: string | null;
}

export interface PostSaleCase {
  id: string;
  orderId: string;
  type: PostSaleType;
  fault: PostSaleFault;
  status: PostSaleStatus;
  description?: string | null;
  shippingPayer?: PostSaleShippingPayer | null;
  shippingAmount?: number | null;
  shippingCarrier?: ShippingCarrier | null;
  trackingNumber?: string | null;
  items?: PostSaleItem[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  variantId?: string;
  variantName?: string;
  variant?: Variant;
}

/**
 * Shipping address stored as JSON on the order. Fields are optional because
 * orders come from several sources (native checkout, WhatsApp, Mercado Libre)
 * with slightly different shapes.
 */
export interface ShippingAddress {
  name?: string;
  /** La tienda guarda el nombre partido en dos, no en `name`. */
  first_name?: string;
  last_name?: string;
  street?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  province?: string;
  zip?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  notes?: string;
}

export type CheckoutLeadStatus = 'OPEN' | 'CONTACTED' | 'LOST';

export interface CheckoutLeadItem {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  quantity: number;
  price: number;
  image?: string;
}

/**
 * Cliente que llenó el checkout y se fue sin pagar. No es una orden: no
 * descuenta stock ni aparece en las ventas.
 */
export interface CheckoutLead {
  id: string;
  sessionId: string;
  email: string;
  phone?: string;
  name?: string;
  shippingAddress?: ShippingAddress;
  items: CheckoutLeadItem[];
  subtotal: number;
  userId?: string;
  status: CheckoutLeadStatus;
  note?: string;
  contactedAt?: string;
  /** Última vez que el cliente tocó el checkout. */
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
  /**
   * Lo calcula el backend cruzando contra las órdenes reales del correo; no es
   * una columna. Solo llega con `?includeConverted=true`, porque la vista por
   * defecto ya los filtra.
   */
  converted: boolean;
  /**
   * Envío que le corresponde hoy según la zona de la dirección, calculado por
   * el backend con las tarifas vigentes. `null` cuando el lead no alcanzó a
   * dejar dirección: sin zona no hay tarifa, y mostrar un número inventado
   * llevaría a ofrecerle al cliente un precio equivocado.
   */
  shippingCost: number | null;
  /**
   * Cuánto le falta al carrito para el envío gratis. `null` si ya lo alcanzó,
   * en cuyo caso el abandono no fue por el costo del envío.
   */
  freeShippingGap: number | null;
}

/** Variant payload sent to the API when creating/updating a product. */
export interface VariantInput {
  id?: string;
  name: string;
  sku: string;
  stock: number;
  price?: number;
  images: string[];
}

/** Product payload sent to the API when creating/updating a product. */
export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  height?: number;
  width?: number;
  length?: number;
  longDescription?: string;
  universeId: string;
  categoryId?: string;
  isB2BOnly: boolean;
  isActive: boolean;
  variants: VariantInput[];
  /** null quita la promoción vigente. */
  discountPrice?: number | null;
  discountEndDate?: string | null;
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

/**
 * Costos del negocio con los que se calcula el precio de un producto impreso.
 * Es una fila única en la base: hay un solo juego de costos vigente.
 */
export interface PricingSettings {
  id: string;
  /** COP por kilo de filamento, tal como se compra el rollo. */
  filamentPricePerKg: number;
  /** Fracción de material que se pierde en fallos y purga (0.06 = 6%). */
  wastePercent: number;
  printerWatts: number;
  energyPricePerKwh: number;
  printerCost: number;
  printerLifeHours: number;
  laborPricePerHour: number;
  packagingCost: number;
  /** Margen objetivo sobre el precio de venta (0.5 = 50%), no un multiplicador. */
  targetMargin: number;
  paymentFeePercent: number;
  roundingStep: number;
  updatedAt: string;
}

/** Lo que se copia del slice de Bambu Studio, más el trabajo manual estimado. */
export interface PriceInput {
  grams: number;
  hours: number;
  laborMinutes: number;
}

export interface PriceBreakdown {
  material: number;
  waste: number;
  energy: number;
  depreciation: number;
  labor: number;
  packaging: number;
  cost: number;
  suggestedPrice: number;
  roundedPrice: number;
  margin: number;
  marginAfterFee: number;
  /** Solo cuando el producto por sí solo dispara el envío gratis. */
  marginWithFreeShipping: number | null;
}

// ── Reseñas de producto ────────────────────────────────────────────────────

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  /** Respuesta pública de Nimvu, si ya se respondió. */
  adminReply: string | null;
  status: ReviewStatus;
  createdAt: string;
  product: { id: string; name: string; slug: string | null; images: string[] };
  user: { id: string; email: string; name: string | null };
}
