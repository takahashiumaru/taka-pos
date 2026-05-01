export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  image?: string;
  active: boolean;
};

export type Category = {
  id: string;
  name: string;
  icon?: string;
};

export type CartItem = {
  productId: string;
  qty: number;
  price: number;
  discount?: number;
};

export type PaymentMethod = "cash" | "card" | "qris" | "transfer";

export type TransactionStatus = "paid" | "void" | "refund" | "hold";

export type Transaction = {
  id: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  change: number;
  method: PaymentMethod;
  customerId?: string;
  cashierId: string;
  cashierName?: string;
  status: TransactionStatus;
  note?: string;
};

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  totalSpend: number;
  level: "reguler" | "silver" | "gold";
};

export type StockMovementType = "in" | "out" | "adjust";

export type StockMovement = {
  id: string;
  productId: string;
  qty: number;
  type: StockMovementType;
  reason?: string;
  refId?: string;
  createdAt: string;
};

export type ParkedCart = {
  id: string;
  label: string;
  items: CartItem[];
  customerId?: string;
  createdAt: string;
};

export type StoreSettings = {
  storeName: string;
  address: string;
  phone: string;
  taxRate: number; // percent
  taxInclusive: boolean;
  currency: string;
  receiptFooter: string;
  enableMethods: PaymentMethod[];
  allowBackorder: boolean;
  storeLogo?: string;
  grayscaleLogo: boolean;
};

export type UserRole = "admin" | "supervisor" | "cashier";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
};
