import { PrismaClient, UserRole, MemberLevel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding TAKA Store POS database...");

  // ---- Settings ----
  await prisma.settings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      storeName: "TAKA Store",
      storeAddress: "Jl. Contoh No. 123, Jakarta",
      storePhone: "021-1234567",
      taxRate: 0.11,
      currency: "IDR",
      receiptFooter: "Terima kasih telah berbelanja di TAKA Store!",
      paymentMethods: "CASH,CARD,QRIS,TRANSFER",
      lowStockAlertEnabled: true,
    },
    update: {},
  });
  console.log("  ✓ Settings");

  // ---- Users ----
  const password = await bcrypt.hash("password123", 10);
  const users = [
    { id: "u_admin", email: "admin@taka.id", name: "Admin TAKA", role: UserRole.ADMIN },
    { id: "u_manager", email: "manager@taka.id", name: "Manajer Toko", role: UserRole.MANAGER },
    { id: "u_kasir1", email: "kasir1@taka.id", name: "Kasir Pagi", role: UserRole.CASHIER },
    { id: "u_kasir2", email: "kasir2@taka.id", name: "Kasir Sore", role: UserRole.CASHIER },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: { id: u.id, email: u.email, name: u.name, role: u.role, passwordHash: password, active: true },
      update: { name: u.name, role: u.role, active: true },
    });
  }
  console.log(`  ✓ Users (${users.length})  — password for all: "password123"`);

  // ---- Categories ----
  const categories = [
    { id: "cat_drink", name: "Minuman" },
    { id: "cat_food", name: "Makanan" },
    { id: "cat_snack", name: "Snack" },
    { id: "cat_household", name: "Rumah Tangga" },
    { id: "cat_other", name: "Lainnya" },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { id: c.id },
      create: c,
      update: { name: c.name },
    });
  }
  console.log(`  ✓ Categories (${categories.length})`);

  // ---- Products (barcodes match frontend seed data) ----
  const products = [
    { sku: "DRK-001", barcode: "8991001000011", name: "Kopi Susu Gula Aren", categoryId: "cat_drink", price: 22000, cost: 12000, stock: 50, minStock: 10 },
    { sku: "DRK-002", barcode: "8991001000028", name: "Es Teh Manis", categoryId: "cat_drink", price: 8000, cost: 3000, stock: 100, minStock: 20 },
    { sku: "DRK-003", barcode: "8991001000035", name: "Cappuccino", categoryId: "cat_drink", price: 28000, cost: 14000, stock: 40, minStock: 10 },
    { sku: "DRK-004", barcode: "8991001000042", name: "Jus Jeruk", categoryId: "cat_drink", price: 18000, cost: 8000, stock: 30, minStock: 10 },
    { sku: "FD-001",  barcode: "8991002000017", name: "Nasi Goreng Spesial", categoryId: "cat_food", price: 25000, cost: 12000, stock: 25, minStock: 5 },
    { sku: "FD-002",  barcode: "8991002000024", name: "Mie Ayam", categoryId: "cat_food", price: 22000, cost: 10000, stock: 30, minStock: 5 },
    { sku: "FD-003",  barcode: "8991002000031", name: "Ayam Geprek", categoryId: "cat_food", price: 28000, cost: 14000, stock: 20, minStock: 5 },
    { sku: "SN-001",  barcode: "8991003000013", name: "Keripik Kentang", categoryId: "cat_snack", price: 12000, cost: 6000, stock: 6, minStock: 10 },
    { sku: "SN-002",  barcode: "8991003000020", name: "Coklat Batang", categoryId: "cat_snack", price: 15000, cost: 8000, stock: 0, minStock: 5 },
    { sku: "SN-003",  barcode: "8991003000037", name: "Kacang Almond", categoryId: "cat_snack", price: 30000, cost: 18000, stock: 15, minStock: 5 },
    { sku: "HH-001",  barcode: "8991004000019", name: "Sabun Cuci Piring", categoryId: "cat_household", price: 14000, cost: 7000, stock: 40, minStock: 10 },
    { sku: "HH-002",  barcode: "8991004000026", name: "Tisu Wajah", categoryId: "cat_household", price: 9500, cost: 4000, stock: 60, minStock: 15 },
    { sku: "HH-003",  barcode: "8991004000033", name: "Detergen 1kg", categoryId: "cat_household", price: 35000, cost: 20000, stock: 20, minStock: 5 },
    { sku: "OTH-001", barcode: "8991005000015", name: "Pulpen Hitam", categoryId: "cat_other", price: 3500, cost: 1500, stock: 100, minStock: 20 },
    { sku: "OTH-002", barcode: "8991005000022", name: "Buku Tulis", categoryId: "cat_other", price: 8500, cost: 4000, stock: 50, minStock: 10 },
    { sku: "OTH-003", barcode: "8991005000039", name: "Baterai AA (4pcs)", categoryId: "cat_other", price: 22000, cost: 12000, stock: 30, minStock: 10 },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      create: { ...p, unit: "pcs", active: true },
      update: { ...p, active: true },
    });
  }
  console.log(`  ✓ Products (${products.length})`);

  // ---- Customers ----
  const customers = [
    { id: "c_walkin", name: "Walk-in Customer", memberLevel: MemberLevel.REGULAR },
    { id: "c_001", name: "Andi Pratama", phone: "081234567890", email: "andi@example.com", memberLevel: MemberLevel.GOLD },
    { id: "c_002", name: "Budi Santoso", phone: "081234567891", memberLevel: MemberLevel.SILVER },
    { id: "c_003", name: "Citra Dewi", phone: "081234567892", email: "citra@example.com", memberLevel: MemberLevel.REGULAR },
  ];
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      create: c,
      update: c,
    });
  }
  console.log(`  ✓ Customers (${customers.length})`);

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
