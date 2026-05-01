import {
  AppUser,
  Category,
  Customer,
  Product,
  StockMovement,
  StoreSettings,
  Transaction,
} from "./types";

export const seedCategories: Category[] = [
  { id: "cat_drinks", name: "Minuman", icon: "Coffee" },
  { id: "cat_snacks", name: "Snack", icon: "Cookie" },
  { id: "cat_food", name: "Makanan", icon: "Utensils" },
  { id: "cat_grocery", name: "Grocery", icon: "ShoppingBag" },
  { id: "cat_household", name: "Rumah Tangga", icon: "Home" },
];

export const seedProducts: Product[] = [
  {
    id: "p_001",
    name: "Kopi Susu Gula Aren",
    sku: "DRK-001",
    barcode: "8991001000011",
    categoryId: "cat_drinks",
    price: 22000,
    cost: 12000,
    stock: 48,
    minStock: 10,
    unit: "cup",
    active: true,
  },
  {
    id: "p_002",
    name: "Es Teh Manis",
    sku: "DRK-002",
    barcode: "8991001000028",
    categoryId: "cat_drinks",
    price: 8000,
    cost: 3000,
    stock: 80,
    minStock: 20,
    unit: "cup",
    active: true,
  },
  {
    id: "p_003",
    name: "Cappuccino",
    sku: "DRK-003",
    categoryId: "cat_drinks",
    price: 28000,
    cost: 15000,
    stock: 25,
    minStock: 8,
    unit: "cup",
    active: true,
  },
  {
    id: "p_004",
    name: "Air Mineral 600ml",
    sku: "DRK-004",
    barcode: "8991001000035",
    categoryId: "cat_drinks",
    price: 5000,
    cost: 2500,
    stock: 120,
    minStock: 30,
    unit: "btl",
    active: true,
  },
  {
    id: "p_005",
    name: "Keripik Kentang",
    sku: "SNK-001",
    barcode: "8991002000019",
    categoryId: "cat_snacks",
    price: 12000,
    cost: 7000,
    stock: 6,
    minStock: 10,
    unit: "pcs",
    active: true,
  },
  {
    id: "p_006",
    name: "Coklat Batang",
    sku: "SNK-002",
    barcode: "8991002000026",
    categoryId: "cat_snacks",
    price: 15000,
    cost: 8500,
    stock: 0,
    minStock: 5,
    unit: "pcs",
    active: true,
  },
  {
    id: "p_007",
    name: "Permen Mint",
    sku: "SNK-003",
    categoryId: "cat_snacks",
    price: 3000,
    cost: 1200,
    stock: 200,
    minStock: 30,
    unit: "pcs",
    active: true,
  },
  {
    id: "p_008",
    name: "Nasi Goreng Spesial",
    sku: "FD-001",
    categoryId: "cat_food",
    price: 28000,
    cost: 14000,
    stock: 30,
    minStock: 5,
    unit: "porsi",
    active: true,
  },
  {
    id: "p_009",
    name: "Mie Ayam",
    sku: "FD-002",
    categoryId: "cat_food",
    price: 22000,
    cost: 11000,
    stock: 25,
    minStock: 5,
    unit: "porsi",
    active: true,
  },
  {
    id: "p_010",
    name: "Sandwich Tuna",
    sku: "FD-003",
    categoryId: "cat_food",
    price: 32000,
    cost: 18000,
    stock: 12,
    minStock: 4,
    unit: "pcs",
    active: true,
  },
  {
    id: "p_011",
    name: "Roti Tawar",
    sku: "GRC-001",
    barcode: "8991003000018",
    categoryId: "cat_grocery",
    price: 18000,
    cost: 11000,
    stock: 18,
    minStock: 6,
    unit: "pcs",
    active: true,
  },
  {
    id: "p_012",
    name: "Susu UHT 1L",
    sku: "GRC-002",
    barcode: "8991003000025",
    categoryId: "cat_grocery",
    price: 22000,
    cost: 15000,
    stock: 40,
    minStock: 10,
    unit: "btl",
    active: true,
  },
  {
    id: "p_013",
    name: "Telur Ayam (10 btr)",
    sku: "GRC-003",
    categoryId: "cat_grocery",
    price: 25000,
    cost: 19000,
    stock: 22,
    minStock: 8,
    unit: "pak",
    active: true,
  },
  {
    id: "p_014",
    name: "Beras Premium 5kg",
    sku: "GRC-004",
    categoryId: "cat_grocery",
    price: 78000,
    cost: 60000,
    stock: 15,
    minStock: 5,
    unit: "pak",
    active: true,
  },
  {
    id: "p_015",
    name: "Sabun Cuci Piring",
    sku: "HH-001",
    categoryId: "cat_household",
    price: 14000,
    cost: 8500,
    stock: 35,
    minStock: 10,
    unit: "btl",
    active: true,
  },
  {
    id: "p_016",
    name: "Tisu Wajah",
    sku: "HH-002",
    categoryId: "cat_household",
    price: 9500,
    cost: 5500,
    stock: 50,
    minStock: 12,
    unit: "pak",
    active: true,
  },
];

export const seedCustomers: Customer[] = [
  {
    id: "cust_001",
    name: "Budi Santoso",
    phone: "081234567890",
    email: "budi@example.com",
    totalSpend: 1250000,
    level: "gold",
  },
  {
    id: "cust_002",
    name: "Siti Aminah",
    phone: "081298765432",
    totalSpend: 540000,
    level: "silver",
  },
  {
    id: "cust_003",
    name: "Andi Pratama",
    phone: "082112345678",
    totalSpend: 120000,
    level: "reguler",
  },
  {
    id: "cust_004",
    name: "Dewi Lestari",
    phone: "081387654321",
    email: "dewi@example.com",
    totalSpend: 2300000,
    level: "gold",
  },
];

export const seedUsers: AppUser[] = [
  {
    id: "u_admin",
    name: "Admin Toko",
    email: "admin@toko.id",
    role: "admin",
    active: true,
  },
  {
    id: "u_super",
    name: "Reza Mahmudi",
    email: "reza@toko.id",
    role: "supervisor",
    active: true,
  },
  {
    id: "u_kasir1",
    name: "Kasir Pagi",
    email: "kasir1@toko.id",
    role: "cashier",
    active: true,
  },
  {
    id: "u_kasir2",
    name: "Kasir Sore",
    email: "kasir2@toko.id",
    role: "cashier",
    active: true,
  },
];

export const defaultSettings: StoreSettings = {
  storeName: "TAKA Store",
  address: "Jl. Merdeka No. 123, Jakarta",
  phone: "021-12345678",
  taxRate: 11,
  taxInclusive: false,
  currency: "IDR",
  receiptFooter: "Terima kasih atas kunjungan Anda!",
  enableMethods: ["cash", "card", "qris", "transfer"],
  allowBackorder: false,
  storeLogo: undefined,
  grayscaleLogo: false,
};

// Generate mock transactions for last 14 days
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateSeedTransactions(): Transaction[] {
  const txs: Transaction[] = [];
  const now = Date.now();
  let counter = 1;
  // Use a deterministic-ish seed via index so SSR/CSR could match if needed.
  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const txCount = 4 + ((dayOffset * 3) % 6);
    for (let i = 0; i < txCount; i++) {
      const date = new Date(now - dayOffset * 86400000);
      date.setHours(9 + ((i * 2) % 12), (i * 7) % 60, 0, 0);
      const itemCount = 1 + (i % 4);
      const items = [];
      let subtotal = 0;
      const usedIds = new Set<string>();
      for (let j = 0; j < itemCount; j++) {
        let p = pickRandom(seedProducts);
        let safety = 0;
        while (usedIds.has(p.id) && safety < 8) {
          p = pickRandom(seedProducts);
          safety++;
        }
        usedIds.add(p.id);
        const qty = 1 + ((i + j) % 3);
        items.push({ productId: p.id, qty, price: p.price });
        subtotal += p.price * qty;
      }
      const tax = Math.round(subtotal * 0.11);
      const total = subtotal + tax;
      const method = pickRandom(["cash", "card", "qris", "transfer"] as const);
      const paid = method === "cash" ? Math.ceil(total / 5000) * 5000 : total;
      txs.push({
        id: `INV-${date.toISOString().slice(0, 10).replace(/-/g, "")}-${String(
          counter
        ).padStart(4, "0")}`,
        createdAt: date.toISOString(),
        items,
        subtotal,
        discount: 0,
        tax,
        total,
        paid,
        change: paid - total,
        method,
        cashierId: pickRandom(["u_kasir1", "u_kasir2"]),
        cashierName: i % 2 === 0 ? "Kasir Pagi" : "Kasir Sore",
        status: "paid",
        customerId: i % 3 === 0 ? pickRandom(seedCustomers).id : undefined,
      });
      counter++;
    }
  }
  return txs;
}

export const seedStockMovements: StockMovement[] = [
  {
    id: "sm_001",
    productId: "p_001",
    qty: 50,
    type: "in",
    reason: "Stok awal",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "sm_002",
    productId: "p_005",
    qty: -2,
    type: "adjust",
    reason: "Rusak / kadaluarsa",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "sm_003",
    productId: "p_006",
    qty: -5,
    type: "out",
    reason: "Kehabisan stok",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];
