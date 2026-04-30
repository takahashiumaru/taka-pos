"use client";

/**
 * API-backed actions. Each function calls the /api endpoint, then updates
 * the Zustand store with the server response. This keeps Zustand as a cache
 * that stays in sync with the MySQL database.
 */
import { api, setToken } from "./api";
import { useStore } from "./store";
import type {
  AppUser,
  Category,
  Customer,
  PaymentMethod,
  Product,
  StoreSettings,
  Transaction,
} from "./types";
import {
  ApiCategory,
  ApiCustomer,
  ApiProduct,
  ApiSettings,
  ApiTransaction,
  ApiUser,
  categoryFromApi,
  customerFromApi,
  productFromApi,
  productToApiCreate,
  productToApiUpdate,
  settingsFromApi,
  settingsToApiUpdate,
  toApiMember,
  toApiPayment,
  toApiRole,
  transactionFromApi,
  userFromApi,
} from "./adapters";

interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string; role: "ADMIN" | "MANAGER" | "CASHIER" };
}

/** Log in via /api/auth/login. Stores JWT and syncs master data. */
export async function loginViaApi(email: string, password: string): Promise<void> {
  const res = await api.loginPublic<LoginResponse>(email, password);
  setToken(res.token);
  await syncFromServer();
  useStore.setState({ currentUserId: res.user.id });
}

export function logoutViaApi(): void {
  setToken(null);
  useStore.getState().logout();
}

/** Fetch all master data from the API and replace Zustand state. */
export async function syncFromServer(): Promise<void> {
  const [prodRes, catRes, custRes, userRes, setRes, txRes] = await Promise.all([
    api.get<{ data: ApiProduct[] }>("/api/products?pageSize=500"),
    api.get<{ data: ApiCategory[] }>("/api/categories"),
    api.get<{ data: ApiCustomer[] }>("/api/customers"),
    api.get<{ data: ApiUser[] }>("/api/users").catch(() => ({ data: [] })),
    api.get<{ data: ApiSettings }>("/api/settings"),
    api.get<{ data: ApiTransaction[] }>("/api/transactions?pageSize=200"),
  ]);

  useStore.setState({
    products: prodRes.data.map(productFromApi),
    categories: catRes.data.map(categoryFromApi),
    customers: custRes.data.map(customerFromApi),
    users: userRes.data.map(userFromApi),
    settings: settingsFromApi(setRes.data),
    transactions: txRes.data.map(transactionFromApi),
  });
}

/* ---------- Products ---------- */
export async function createProductApi(p: Omit<Product, "id">): Promise<Product> {
  const res = await api.post<{ data: ApiProduct }>("/api/products", productToApiCreate(p));
  const product = productFromApi(res.data);
  useStore.setState((s) => ({ products: [product, ...s.products] }));
  return product;
}

export async function updateProductApi(id: string, patch: Partial<Product>): Promise<Product> {
  const res = await api.put<{ data: ApiProduct }>(`/api/products/${id}`, productToApiUpdate(patch));
  const product = productFromApi(res.data);
  useStore.setState((s) => ({
    products: s.products.map((p) => (p.id === id ? product : p)),
  }));
  return product;
}

export async function deleteProductApi(id: string): Promise<void> {
  await api.del(`/api/products/${id}`);
  useStore.setState((s) => ({ products: s.products.filter((p) => p.id !== id) }));
}

/* ---------- Categories ---------- */
export async function createCategoryApi(name: string): Promise<Category> {
  const res = await api.post<{ data: ApiCategory }>("/api/categories", { name });
  const cat = categoryFromApi(res.data);
  useStore.setState((s) => ({ categories: [...s.categories, cat] }));
  return cat;
}

export async function deleteCategoryApi(id: string): Promise<void> {
  await api.del(`/api/categories/${id}`);
  useStore.setState((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
}

/* ---------- Customers ---------- */
export async function createCustomerApi(
  c: Omit<Customer, "id" | "totalSpend" | "level"> & { level?: Customer["level"] }
): Promise<Customer> {
  const res = await api.post<{ data: ApiCustomer }>("/api/customers", {
    name: c.name,
    phone: c.phone || null,
    email: c.email || null,
    memberLevel: c.level ? toApiMember(c.level) : "REGULAR",
  });
  const cust = customerFromApi(res.data);
  useStore.setState((s) => ({ customers: [cust, ...s.customers] }));
  return cust;
}

export async function updateCustomerApi(id: string, patch: Partial<Customer>): Promise<Customer> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.phone !== undefined) payload.phone = patch.phone || null;
  if (patch.email !== undefined) payload.email = patch.email || null;
  if (patch.level !== undefined) payload.memberLevel = toApiMember(patch.level);
  const res = await api.put<{ data: ApiCustomer }>(`/api/customers/${id}`, payload);
  const cust = customerFromApi(res.data);
  useStore.setState((s) => ({
    customers: s.customers.map((c) => (c.id === id ? cust : c)),
  }));
  return cust;
}

export async function deleteCustomerApi(id: string): Promise<void> {
  await api.del(`/api/customers/${id}`);
  useStore.setState((s) => ({ customers: s.customers.filter((c) => c.id !== id) }));
}

/* ---------- Users ---------- */
export async function createUserApi(
  u: Omit<AppUser, "id"> & { password: string }
): Promise<AppUser> {
  const res = await api.post<{ data: ApiUser }>("/api/users", {
    name: u.name,
    email: u.email,
    password: u.password,
    role: toApiRole(u.role),
    active: u.active,
  });
  const user = userFromApi(res.data);
  useStore.setState((s) => ({ users: [...s.users, user] }));
  return user;
}

export async function updateUserApi(
  id: string,
  patch: Partial<AppUser> & { password?: string }
): Promise<AppUser> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.email !== undefined) payload.email = patch.email;
  if (patch.role !== undefined) payload.role = toApiRole(patch.role);
  if (patch.active !== undefined) payload.active = patch.active;
  if (patch.password) payload.password = patch.password;
  const res = await api.put<{ data: ApiUser }>(`/api/users/${id}`, payload);
  const user = userFromApi(res.data);
  useStore.setState((s) => ({ users: s.users.map((x) => (x.id === id ? user : x)) }));
  return user;
}

export async function deleteUserApi(id: string): Promise<void> {
  await api.del(`/api/users/${id}`);
  useStore.setState((s) => ({ users: s.users.filter((u) => u.id !== id) }));
}

/* ---------- Settings ---------- */
export async function updateSettingsApi(patch: Partial<StoreSettings>): Promise<StoreSettings> {
  const res = await api.put<{ data: ApiSettings }>("/api/settings", settingsToApiUpdate(patch));
  const settings = settingsFromApi(res.data);
  useStore.setState({ settings });
  return settings;
}

/* ---------- Transactions (checkout) ---------- */
export async function checkoutViaApi(input: {
  items: { productId: string; qty: number; discount: number }[];
  discount: number;
  method: PaymentMethod;
  paid: number;
  customerId?: string;
  note?: string;
}): Promise<Transaction> {
  const res = await api.post<{ data: ApiTransaction }>("/api/transactions", {
    items: input.items,
    discount: input.discount,
    paymentMethod: toApiPayment(input.method),
    cashReceived: input.method === "cash" ? input.paid : null,
    customerId: input.customerId ?? null,
    notes: input.note ?? null,
  });
  const tx = transactionFromApi(res.data);

  // Refresh products (stock was decremented server-side)
  const prodRes = await api.get<{ data: ApiProduct[] }>("/api/products?pageSize=500");

  useStore.setState((s) => ({
    transactions: [tx, ...s.transactions],
    products: prodRes.data.map(productFromApi),
    cart: [],
    cartDiscount: 0,
    cartCustomerId: undefined,
  }));
  return tx;
}

/* ---------- Void ---------- */
export async function voidTransactionApi(id: string, reason: string): Promise<void> {
  await api.post<{ data: ApiTransaction }>(`/api/transactions/${id}/void`, { reason });
  // Refresh txs + products
  const [txRes, prodRes] = await Promise.all([
    api.get<{ data: ApiTransaction[] }>("/api/transactions?pageSize=200"),
    api.get<{ data: ApiProduct[] }>("/api/products?pageSize=500"),
  ]);
  useStore.setState({
    transactions: txRes.data.map(transactionFromApi),
    products: prodRes.data.map(productFromApi),
  });
}

/* ---------- Inventory movements ---------- */
export async function addStockMovementApi(input: {
  productId: string;
  type: "in" | "out" | "adjust";
  qty: number;
  reason?: string;
}): Promise<void> {
  const typeMap = { in: "IN", out: "OUT", adjust: "ADJUST" } as const;
  await api.post(`/api/inventory/movements`, {
    productId: input.productId,
    type: typeMap[input.type],
    qty: input.qty,
    reason: input.reason ?? null,
  });
  // Refresh products
  const prodRes = await api.get<{ data: ApiProduct[] }>("/api/products?pageSize=500");
  useStore.setState({ products: prodRes.data.map(productFromApi) });
}
