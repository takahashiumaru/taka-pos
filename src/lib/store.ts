"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AppUser,
  CartItem,
  Category,
  Customer,
  ParkedCart,
  PaymentMethod,
  Product,
  StockMovement,
  StoreSettings,
  Transaction,
} from "./types";
import {
  defaultSettings,
  generateSeedTransactions,
  seedCategories,
  seedCustomers,
  seedProducts,
  seedStockMovements,
  seedUsers,
} from "./seed";
import { genId, genInvoiceNo } from "./utils";

type DataState = {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;

  products: Product[];
  categories: Category[];
  customers: Customer[];
  transactions: Transaction[];
  movements: StockMovement[];
  users: AppUser[];
  settings: StoreSettings;
  invoiceCounter: number;

  // Cart (active)
  cart: CartItem[];
  cartCustomerId?: string;
  cartDiscount: number;

  // Parked carts
  parked: ParkedCart[];

  // Auth
  currentUserId?: string;

  // Reset
  resetSeed: () => void;

  // Auth actions
  login: (userId: string) => void;
  logout: () => void;

  // Product actions
  addProduct: (p: Omit<Product, "id">) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Category actions
  addCategory: (c: Omit<Category, "id">) => Category;
  deleteCategory: (id: string) => void;

  // Customer actions
  addCustomer: (c: Omit<Customer, "id" | "totalSpend" | "level">) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Cart actions
  addToCart: (productId: string, qty?: number) => void;
  setCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  setItemDiscount: (productId: string, discount: number) => void;
  setCartDiscount: (d: number) => void;
  setCartCustomer: (customerId?: string) => void;
  clearCart: () => void;

  // Parking
  parkCurrentCart: (label?: string) => void;
  resumeParked: (id: string) => void;
  deleteParked: (id: string) => void;

  // Checkout
  checkout: (input: {
    method: PaymentMethod;
    paid: number;
    note?: string;
  }) => Transaction | null;

  // Inventory
  addStockMovement: (m: Omit<StockMovement, "id" | "createdAt">) => StockMovement;
  voidTransaction: (id: string) => void;

  // Settings
  updateSettings: (patch: Partial<StoreSettings>) => void;

  // User
  addUser: (u: Omit<AppUser, "id">) => AppUser;
  updateUser: (id: string, patch: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
};

function calcCartTotals(
  cart: CartItem[],
  cartDiscount: number,
  taxRate: number,
  taxInclusive: boolean
) {
  const subtotal = cart.reduce(
    (s, it) => s + (it.price - (it.discount || 0)) * it.qty,
    0
  );
  const afterDiscount = Math.max(0, subtotal - cartDiscount);
  let tax = 0;
  let total = afterDiscount;
  if (taxRate > 0) {
    if (taxInclusive) {
      tax = Math.round(afterDiscount - afterDiscount / (1 + taxRate / 100));
      total = afterDiscount;
    } else {
      tax = Math.round(afterDiscount * (taxRate / 100));
      total = afterDiscount + tax;
    }
  }
  return { subtotal, tax, total };
}

export const useStore = create<DataState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      products: seedProducts,
      categories: seedCategories,
      customers: seedCustomers,
      transactions: [],
      movements: seedStockMovements,
      users: seedUsers,
      settings: defaultSettings,
      invoiceCounter: 1,

      cart: [],
      cartCustomerId: undefined,
      cartDiscount: 0,
      parked: [],
      currentUserId: "u_kasir1",

      resetSeed: () =>
        set({
          products: seedProducts,
          categories: seedCategories,
          customers: seedCustomers,
          transactions: generateSeedTransactions(),
          movements: seedStockMovements,
          users: seedUsers,
          settings: defaultSettings,
          invoiceCounter: 1,
          cart: [],
          parked: [],
          cartDiscount: 0,
          cartCustomerId: undefined,
        }),

      login: (userId) => set({ currentUserId: userId }),
      logout: () => set({ currentUserId: undefined }),

      addProduct: (p) => {
        const barcode =
          p.barcode && p.barcode.trim()
            ? p.barcode.trim()
            : `200${Date.now().toString().slice(-9)}${Math.floor(
                Math.random() * 10
              )}`.slice(0, 13);
        const product: Product = { ...p, barcode, id: genId("p") };
        set((s) => ({ products: [product, ...s.products] }));
        if (p.stock > 0) {
          get().addStockMovement({
            productId: product.id,
            qty: p.stock,
            type: "in",
            reason: "Stok awal produk baru",
          });
        }
        return product;
      },

      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        })),

      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      addCategory: (c) => {
        const cat: Category = { ...c, id: genId("cat") };
        set((s) => ({ categories: [...s.categories, cat] }));
        return cat;
      },
      deleteCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      addCustomer: (c) => {
        const customer: Customer = {
          ...c,
          id: genId("cust"),
          totalSpend: 0,
          level: "reguler",
        };
        set((s) => ({ customers: [customer, ...s.customers] }));
        return customer;
      },
      updateCustomer: (id, patch) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),
      deleteCustomer: (id) =>
        set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

      addToCart: (productId, qty = 1) => {
        const product = get().products.find((p) => p.id === productId);
        if (!product) return;
        const existing = get().cart.find((it) => it.productId === productId);
        const allowBackorder = get().settings.allowBackorder;
        if (existing) {
          const newQty = existing.qty + qty;
          if (!allowBackorder && newQty > product.stock) return;
          set((s) => ({
            cart: s.cart.map((it) =>
              it.productId === productId ? { ...it, qty: newQty } : it
            ),
          }));
        } else {
          if (!allowBackorder && qty > product.stock) return;
          set((s) => ({
            cart: [
              ...s.cart,
              { productId, qty, price: product.price, discount: 0 },
            ],
          }));
        }
      },
      setCartQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeFromCart(productId);
          return;
        }
        const product = get().products.find((p) => p.id === productId);
        if (!product) return;
        const allowBackorder = get().settings.allowBackorder;
        if (!allowBackorder && qty > product.stock) qty = product.stock;
        set((s) => ({
          cart: s.cart.map((it) =>
            it.productId === productId ? { ...it, qty } : it
          ),
        }));
      },
      removeFromCart: (productId) =>
        set((s) => ({
          cart: s.cart.filter((it) => it.productId !== productId),
        })),
      setItemDiscount: (productId, discount) =>
        set((s) => ({
          cart: s.cart.map((it) =>
            it.productId === productId ? { ...it, discount } : it
          ),
        })),
      setCartDiscount: (d) => set({ cartDiscount: d }),
      setCartCustomer: (id) => set({ cartCustomerId: id }),
      clearCart: () =>
        set({ cart: [], cartCustomerId: undefined, cartDiscount: 0 }),

      parkCurrentCart: (label) => {
        const { cart, cartCustomerId } = get();
        if (cart.length === 0) return;
        const parked: ParkedCart = {
          id: genId("park"),
          label: label || `Cart ${new Date().toLocaleTimeString("id-ID")}`,
          items: cart,
          customerId: cartCustomerId,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          parked: [...s.parked, parked],
          cart: [],
          cartCustomerId: undefined,
          cartDiscount: 0,
        }));
      },
      resumeParked: (id) => {
        const p = get().parked.find((x) => x.id === id);
        if (!p) return;
        // Park current first if not empty
        if (get().cart.length > 0) get().parkCurrentCart();
        set((s) => ({
          cart: p.items,
          cartCustomerId: p.customerId,
          parked: s.parked.filter((x) => x.id !== id),
        }));
      },
      deleteParked: (id) =>
        set((s) => ({ parked: s.parked.filter((x) => x.id !== id) })),

      checkout: ({ method, paid, note }) => {
        const {
          cart,
          cartDiscount,
          cartCustomerId,
          settings,
          invoiceCounter,
          currentUserId,
          users,
        } = get();
        if (cart.length === 0) return null;
        const { subtotal, tax, total } = calcCartTotals(
          cart,
          cartDiscount,
          settings.taxRate,
          settings.taxInclusive
        );
        if (paid < total) return null;
        const cashier = users.find((u) => u.id === currentUserId);
        const tx: Transaction = {
          id: genInvoiceNo(invoiceCounter),
          createdAt: new Date().toISOString(),
          items: cart,
          subtotal,
          discount: cartDiscount,
          tax,
          total,
          paid,
          change: paid - total,
          method,
          customerId: cartCustomerId,
          cashierId: currentUserId || "u_kasir1",
          cashierName: cashier?.name,
          status: "paid",
          note,
        };
        // Reduce stock + add stock movements
        set((s) => ({
          transactions: [tx, ...s.transactions],
          invoiceCounter: s.invoiceCounter + 1,
          products: s.products.map((p) => {
            const ci = cart.find((c) => c.productId === p.id);
            if (!ci) return p;
            return { ...p, stock: Math.max(0, p.stock - ci.qty) };
          }),
          movements: [
            ...cart.map<StockMovement>((c) => ({
              id: genId("sm"),
              productId: c.productId,
              qty: -c.qty,
              type: "out",
              reason: "Penjualan",
              refId: tx.id,
              createdAt: tx.createdAt,
            })),
            ...s.movements,
          ],
          customers: cartCustomerId
            ? s.customers.map((c) =>
                c.id === cartCustomerId
                  ? {
                      ...c,
                      totalSpend: c.totalSpend + total,
                      level:
                        c.totalSpend + total >= 1000000
                          ? "gold"
                          : c.totalSpend + total >= 300000
                          ? "silver"
                          : c.level,
                    }
                  : c
              )
            : s.customers,
          cart: [],
          cartDiscount: 0,
          cartCustomerId: undefined,
        }));
        return tx;
      },

      addStockMovement: (m) => {
        const sm: StockMovement = {
          ...m,
          id: genId("sm"),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          movements: [sm, ...s.movements],
          products: s.products.map((p) =>
            p.id === m.productId
              ? {
                  ...p,
                  stock: Math.max(0, p.stock + m.qty),
                }
              : p
          ),
        }));
        return sm;
      },

      voidTransaction: (id) => {
        const tx = get().transactions.find((t) => t.id === id);
        if (!tx || tx.status !== "paid") return;
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, status: "void" } : t
          ),
          // restore stock
          products: s.products.map((p) => {
            const ci = tx.items.find((c) => c.productId === p.id);
            if (!ci) return p;
            return { ...p, stock: p.stock + ci.qty };
          }),
          movements: [
            ...tx.items.map<StockMovement>((c) => ({
              id: genId("sm"),
              productId: c.productId,
              qty: c.qty,
              type: "in",
              reason: "Void transaksi",
              refId: tx.id,
              createdAt: new Date().toISOString(),
            })),
            ...s.movements,
          ],
        }));
      },

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      addUser: (u) => {
        const user: AppUser = { ...u, id: genId("u") };
        set((s) => ({ users: [...s.users, user] }));
        return user;
      },
      updateUser: (id, patch) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        })),
      deleteUser: (id) =>
        set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
    }),
    {
      name: "pos-store",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Partial<DataState> | undefined;
        if (state && version < 2 && state.settings) {
          if (state.settings.storeName === "Toko Kita") {
            state.settings = { ...state.settings, storeName: "TAKA Store" };
          }
        }
        return state as DataState;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        // Generate initial transactions if empty
        if (state && state.transactions.length === 0) {
          state.transactions.push(...generateSeedTransactions());
          state.invoiceCounter = state.transactions.length + 1;
        }
      },
    }
  )
);

export function useCartTotals() {
  const cart = useStore((s) => s.cart);
  const cartDiscount = useStore((s) => s.cartDiscount);
  const taxRate = useStore((s) => s.settings.taxRate);
  const taxInclusive = useStore((s) => s.settings.taxInclusive);
  const base = calcCartTotals(cart, cartDiscount, taxRate, taxInclusive);
  const afterDiscount = Math.max(0, base.subtotal - cartDiscount);
  return {
    subtotal: base.subtotal,
    discount: cartDiscount,
    taxableBase: afterDiscount,
    tax: base.tax,
    total: base.total,
  };
}

export { calcCartTotals };
