/**
 * Adapters that convert API shapes (Prisma models) <-> frontend types (src/lib/types.ts).
 * Field differences:
 *  - Product.image (FE) <-> imageBase64 (API)
 *  - Enum case: lowercase on FE ("cash", "paid", "in", "cashier") vs UPPERCASE on API
 *  - Settings: address/phone/taxRate(percent)/enableMethods(array) on FE vs
 *              storeAddress/storePhone/taxRate(decimal)/paymentMethods(CSV) on API
 */
import type {
  AppUser,
  Category,
  Customer,
  PaymentMethod,
  Product,
  StockMovement,
  StockMovementType,
  StoreSettings,
  Transaction,
  TransactionStatus,
  UserRole,
} from "./types";

/* ---------- Enum helpers ---------- */
export const toApiPayment = (m: PaymentMethod) => m.toUpperCase() as "CASH" | "CARD" | "QRIS" | "TRANSFER";
export const fromApiPayment = (m: string): PaymentMethod => m.toLowerCase() as PaymentMethod;
export const toApiStatus = (s: TransactionStatus) =>
  (s === "paid" ? "PAID" : s === "void" ? "VOID" : "PAID") as "PAID" | "VOID";
export const fromApiStatus = (s: string): TransactionStatus =>
  s === "VOID" ? "void" : "paid";
export const toApiMovementType = (t: StockMovementType) => t.toUpperCase() as "IN" | "OUT" | "ADJUST";
export const fromApiMovementType = (t: string): StockMovementType => t.toLowerCase() as StockMovementType;
export const toApiRole = (r: UserRole) =>
  (r === "admin" ? "ADMIN" : r === "supervisor" ? "MANAGER" : "CASHIER") as "ADMIN" | "MANAGER" | "CASHIER";
export const fromApiRole = (r: string): UserRole =>
  r === "ADMIN" ? "admin" : r === "MANAGER" ? "supervisor" : "cashier";
export const toApiMember = (l: Customer["level"]) =>
  (l === "gold" ? "GOLD" : l === "silver" ? "SILVER" : "REGULAR") as "GOLD" | "SILVER" | "REGULAR";
export const fromApiMember = (l: string): Customer["level"] =>
  l === "GOLD" ? "gold" : l === "SILVER" ? "silver" : "reguler";

/* ---------- Product ---------- */
export interface ApiProduct {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string | null;
  price: number;
  cost: number;
  unit: string;
  stock: number;
  minStock: number;
  active: boolean;
  imageBase64: string | null;
  categoryId: string | null;
}

export function productFromApi(p: ApiProduct): Product {
  return {
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
    price: p.price,
    cost: p.cost,
    unit: p.unit,
    stock: p.stock,
    minStock: p.minStock,
    active: p.active,
    image: p.imageBase64 ?? undefined,
    categoryId: p.categoryId ?? "",
  };
}

export function productToApiCreate(p: Omit<Product, "id">): Omit<ApiProduct, "id"> {
  return {
    sku: p.sku,
    barcode: p.barcode ?? "",
    name: p.name,
    description: null,
    price: p.price,
    cost: p.cost,
    unit: p.unit,
    stock: p.stock,
    minStock: p.minStock,
    active: p.active,
    imageBase64: p.image ?? null,
    categoryId: p.categoryId || null,
  };
}

export function productToApiUpdate(patch: Partial<Product>): Partial<ApiProduct> {
  const out: Partial<ApiProduct> = {};
  if (patch.sku !== undefined) out.sku = patch.sku;
  if (patch.barcode !== undefined) out.barcode = patch.barcode;
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.price !== undefined) out.price = patch.price;
  if (patch.cost !== undefined) out.cost = patch.cost;
  if (patch.unit !== undefined) out.unit = patch.unit;
  if (patch.stock !== undefined) out.stock = patch.stock;
  if (patch.minStock !== undefined) out.minStock = patch.minStock;
  if (patch.active !== undefined) out.active = patch.active;
  if (patch.image !== undefined) out.imageBase64 = patch.image ?? null;
  if (patch.categoryId !== undefined) out.categoryId = patch.categoryId || null;
  return out;
}

/* ---------- Category ---------- */
export interface ApiCategory {
  id: string;
  name: string;
}
export const categoryFromApi = (c: ApiCategory): Category => ({ id: c.id, name: c.name });

/* ---------- Customer ---------- */
export interface ApiCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  memberLevel: "REGULAR" | "SILVER" | "GOLD";
}

export const customerFromApi = (c: ApiCustomer): Customer => ({
  id: c.id,
  name: c.name,
  phone: c.phone ?? undefined,
  email: c.email ?? undefined,
  level: fromApiMember(c.memberLevel),
  totalSpend: 0,
});

/* ---------- User ---------- */
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "CASHIER";
  active: boolean;
}
export const userFromApi = (u: ApiUser): AppUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: fromApiRole(u.role),
  active: u.active,
});

/* ---------- Transaction ---------- */
export interface ApiTransactionItem {
  productId: string;
  qty: number;
  price: number;
  discount: number;
  subtotal: number;
}
export interface ApiTransaction {
  id: string;
  userId: string;
  customerId: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "CASH" | "CARD" | "QRIS" | "TRANSFER";
  cashReceived: number | null;
  changeAmount: number | null;
  status: "PAID" | "VOID";
  notes: string | null;
  createdAt: string;
  items: ApiTransactionItem[];
  user?: { id: string; name: string };
}
export const transactionFromApi = (t: ApiTransaction): Transaction => ({
  id: t.id,
  createdAt: t.createdAt,
  items: t.items.map((i) => ({
    productId: i.productId,
    qty: i.qty,
    price: i.price,
    discount: i.discount,
  })),
  subtotal: t.subtotal,
  discount: t.discount,
  tax: t.tax,
  total: t.total,
  paid: t.cashReceived ?? t.total,
  change: t.changeAmount ?? 0,
  method: fromApiPayment(t.paymentMethod),
  customerId: t.customerId ?? undefined,
  cashierId: t.userId,
  cashierName: t.user?.name,
  status: fromApiStatus(t.status),
  note: t.notes ?? undefined,
});

/* ---------- InventoryMovement ---------- */
export interface ApiMovement {
  id: string;
  productId: string;
  type: "IN" | "OUT" | "ADJUST";
  qty: number;
  reason: string | null;
  refInvoice: string | null;
  createdAt: string;
}
export const movementFromApi = (m: ApiMovement): StockMovement => ({
  id: m.id,
  productId: m.productId,
  qty: m.qty,
  type: fromApiMovementType(m.type),
  reason: m.reason ?? undefined,
  refId: m.refInvoice ?? undefined,
  createdAt: m.createdAt,
});

/* ---------- Settings ---------- */
export interface ApiSettings {
  storeName: string;
  storeAddress: string | null;
  storePhone: string | null;
  taxRate: number; // decimal 0.11
  currency: string;
  receiptFooter: string | null;
  paymentMethods: string; // CSV
  lowStockAlertEnabled: boolean;
  storeLogo: string | null;
  grayscaleLogo: boolean;
}
export const settingsFromApi = (s: ApiSettings): StoreSettings => ({
  storeName: s.storeName,
  address: s.storeAddress ?? "",
  phone: s.storePhone ?? "",
  taxRate: Math.round(s.taxRate * 100),
  taxInclusive: false,
  currency: s.currency,
  receiptFooter: s.receiptFooter ?? "",
  enableMethods: s.paymentMethods
    ? s.paymentMethods.split(",").map((m) => m.trim().toLowerCase()).filter(Boolean) as PaymentMethod[]
    : ["cash", "card", "qris", "transfer"],
  allowBackorder: false,
  storeLogo: s.storeLogo ?? undefined,
  grayscaleLogo: s.grayscaleLogo ?? false,
});
export const settingsToApiUpdate = (patch: Partial<StoreSettings>): Partial<ApiSettings> => {
  const out: Partial<ApiSettings> = {};
  if (patch.storeName !== undefined) out.storeName = patch.storeName;
  if (patch.address !== undefined) out.storeAddress = patch.address || null;
  if (patch.phone !== undefined) out.storePhone = patch.phone || null;
  if (patch.taxRate !== undefined) out.taxRate = patch.taxRate / 100;
  if (patch.currency !== undefined) out.currency = patch.currency;
  if (patch.receiptFooter !== undefined) out.receiptFooter = patch.receiptFooter || null;
  if (patch.enableMethods !== undefined)
    out.paymentMethods = patch.enableMethods.map((m) => m.toUpperCase()).join(",");
  if (patch.storeLogo !== undefined) out.storeLogo = patch.storeLogo || null;
  if (patch.grayscaleLogo !== undefined) out.grayscaleLogo = patch.grayscaleLogo;
  return out;
};
