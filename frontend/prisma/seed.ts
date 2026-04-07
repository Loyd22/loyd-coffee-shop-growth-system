import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // First, delete old data so we do not get duplicates when seeding again
  // We delete child tables first because they depend on parent tables
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  // ---------------------------
  // 1. Create sample branches
  // ---------------------------
  await prisma.branch.createMany({
    data: [
      {
        branchName: "Loyd Coffee Shop - Binan",
        branchCode: "BINAN",
        address: "Binan, Laguna",
        city: "Binan",
        status: "active",
      },
      {
        branchName: "Loyd Coffee Shop - Santa Rosa",
        branchCode: "STA-ROSA",
        address: "Santa Rosa, Laguna",
        city: "Santa Rosa",
        status: "active",
      },
      {
        branchName: "Loyd Coffee Shop - Calamba",
        branchCode: "CALAMBA",
        address: "Calamba, Laguna",
        city: "Calamba",
        status: "active",
      },
      {
        branchName: "Loyd Coffee Shop - Alabang",
        branchCode: "ALABANG",
        address: "Alabang, Muntinlupa",
        city: "Muntinlupa",
        status: "active",
      },
      {
        branchName: "Loyd Coffee Shop - Makati",
        branchCode: "MAKATI",
        address: "Makati City",
        city: "Makati",
        status: "active",
      },
    ],
  });

  // Fetch the created branches so we can use their IDs later
  const allBranches = await prisma.branch.findMany();

  // ---------------------------
  // 2. Create sample products
  // ---------------------------
  await prisma.product.createMany({
    data: [
      { productName: "Americano", category: "Hot Coffee", price: 120, status: "active" },
      { productName: "Latte", category: "Hot Coffee", price: 150, status: "active" },
      { productName: "Cappuccino", category: "Hot Coffee", price: 145, status: "active" },
      { productName: "Mocha", category: "Hot Coffee", price: 160, status: "active" },
      { productName: "Caramel Macchiato", category: "Hot Coffee", price: 170, status: "active" },
      { productName: "Spanish Latte", category: "Iced Coffee", price: 165, status: "active" },
      { productName: "Iced Coffee", category: "Iced Coffee", price: 130, status: "active" },
      { productName: "Vanilla Latte", category: "Iced Coffee", price: 160, status: "active" },
      { productName: "Hazelnut Latte", category: "Iced Coffee", price: 160, status: "active" },
      { productName: "Espresso", category: "Hot Coffee", price: 100, status: "active" },
    ],
  });

  // Fetch the created products so we can use their IDs later
  const allProducts = await prisma.product.findMany();

  // ---------------------------
  // 3. Create sample customers
  // ---------------------------
  await prisma.customer.createMany({
    data: [
      {
        customerCode: "CUST-001",
        fullName: "John Cruz",
        email: "john.cruz@example.com",
        phoneNumber: "09170000001",
        gender: "Male",
        loyaltyMember: true,
      },
      {
        customerCode: "CUST-002",
        fullName: "Maria Santos",
        email: "maria.santos@example.com",
        phoneNumber: "09170000002",
        gender: "Female",
        loyaltyMember: true,
      },
      {
        customerCode: "CUST-003",
        fullName: "Paolo Reyes",
        email: "paolo.reyes@example.com",
        phoneNumber: "09170000003",
        gender: "Male",
        loyaltyMember: false,
      },
      {
        customerCode: "CUST-004",
        fullName: "Angela Lim",
        email: "angela.lim@example.com",
        phoneNumber: "09170000004",
        gender: "Female",
        loyaltyMember: true,
      },
      {
        customerCode: "CUST-005",
        fullName: "Mark Dela Cruz",
        email: "mark.delacruz@example.com",
        phoneNumber: "09170000005",
        gender: "Male",
        loyaltyMember: false,
      },
    ],
  });

  // Fetch the created customers so we can use their IDs later
  const allCustomers = await prisma.customer.findMany();

  // ---------------------------
  // 4. Create sample transactions
  // ---------------------------
  const transaction1 = await prisma.transaction.create({
    data: {
      transactionCode: "TXN-001",
      branchId: allBranches[0].id,
      customerId: allCustomers[0].id,
      transactionDate: new Date("2026-04-01T09:15:00"),
      paymentMethod: "Cash",
      subtotal: 270,
      discountAmount: 0,
      totalAmount: 270,
    },
  });

  const transaction2 = await prisma.transaction.create({
    data: {
      transactionCode: "TXN-002",
      branchId: allBranches[1].id,
      customerId: allCustomers[1].id,
      transactionDate: new Date("2026-04-01T10:30:00"),
      paymentMethod: "GCash",
      subtotal: 160,
      discountAmount: 0,
      totalAmount: 160,
    },
  });

  // ---------------------------
  // 5. Create sample transaction items
  // ---------------------------
  await prisma.transactionItem.createMany({
    data: [
      {
        transactionId: transaction1.id,
        productId: allProducts[1].id,
        quantity: 1,
        unitPrice: 150,
        lineTotal: 150,
      },
      {
        transactionId: transaction1.id,
        productId: allProducts[0].id,
        quantity: 1,
        unitPrice: 120,
        lineTotal: 120,
      },
      {
        transactionId: transaction2.id,
        productId: allProducts[3].id,
        quantity: 1,
        unitPrice: 160,
        lineTotal: 160,
      },
    ],
  });

  console.log("Sample data seeded successfully.");
}

// Run the seed script
main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    // Always disconnect Prisma at the end
    await prisma.$disconnect();
  });