/// <reference types="node" />
import {
  PrismaClient,
  OrderStatus,
  DocumentStatus,
  DocumentType,
  UserType,
  KycStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

// Helper to generate realistic IPFS CIDs
function generateMockCID(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz234567";
  let cid = "bafybeib";
  for (let i = 0; i < 52; i++) {
    cid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return cid;
}

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Use your real wallet address for all users (buyer and producer/seller)
  const REAL_WALLET = "0xdbdaeF88839e18feF4E9C148b865bcC89dD44482";

  // Clean existing data (children → parents to avoid FK violations)
  console.log("🗑️  Cleaning existing data...");
  await prisma.document.deleteMany();
  await prisma.bankReview.deleteMany();
  await prisma.orderedItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.bankAuthSession.deleteMany();
  await prisma.userBank.deleteMany(); // delete user-bank links before users
  await prisma.user.deleteMany();
  await prisma.bank.deleteMany();
  console.log("✅ Database cleaned\n");

  // ----- Banks -----
  console.log("🏦 Creating banks...");
  const bank1 = await prisma.bank.create({
    data: { code: "AMTBUS33", name: "American Trade Bank", country: "USA" },
  });
  const bank2 = await prisma.bank.create({
    data: { code: "PACBUS44", name: "Pacific Commerce Bank", country: "USA" },
  });
  const bank3 = await prisma.bank.create({
    data: { code: "DEHADE5M", name: "Deutsche Handelsbank", country: "Germany" },
  });
  const bank4 = await prisma.bank.create({
    data: { code: "BNPAFRPP", name: "Banque Commerciale", country: "France" },
  });
  const bank5 = await prisma.bank.create({
    data: { code: "TOTRJPJT", name: "Tokyo Trading Bank", country: "Japan" },
  });
  console.log("✅ Created 5 banks\n");

  // ----- Users -----
  console.log("👥 Creating users...");

  // Single user with your real wallet (acts as producer/seller for the products)
  const testUser = await prisma.user.create({
    data: {
      walletAddress: REAL_WALLET,
      fullName: "Test Merchant",
      email: "test@example.com",
      userType: UserType.PRODUCER,
      isVerified: true,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  // Extra users to drive sample orders
  const buyer2 = await prisma.user.create({
    data: {
      walletAddress: "0x1111111111111111111111111111111111111111",
      fullName: "Test Buyer 2",
      email: "buyer2@example.com",
      userType: UserType.BUYER,
      isVerified: true,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  const producer2 = await prisma.user.create({
    data: {
      walletAddress: "0x2222222222222222222222222222222222222222",
      fullName: "Test Producer 2",
      email: "producer2@example.com",
      userType: UserType.PRODUCER,
      isVerified: true,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  console.log("✅ Created 3 users\n");

  // ----- Products (ONLY the 10 PSQL-mirrored products) -----
  console.log("📦 Creating products...");

  const cocoa = await prisma.product.create({
    data: {
      name: "Cocoa",
      quantity: 1000,
      unit: "kg",
      pricePerUnit: 2.5,
      countryOfOrigin: "Ghana",
      category: "agri",
      subcategory: "cocoa",
      description:
        "High-quality fermented and sun-dried cocoa beans sourced from smallholder farms. Certified organic and fair trade.",
      hsCode: "1801.00",
      incoterm: "FOB",
      minOrderQty: 500,
      leadTimeDays: 14,
      images: [{ mime: "image/jpeg", path: "/uploads/images/1.jpg", filename: "1.jpg" }],
      updatedAt: new Date(),
      producerWalletId: testUser.walletAddress,
    },
  });

  const coffee = await prisma.product.create({
    data: {
      name: "Coffee",
      quantity: 1000,
      unit: "kg",
      pricePerUnit: 3.0,
      countryOfOrigin: "Ethiopia",
      category: "agri",
      subcategory: "coffee",
      description: "Premium roasted coffee beans with rich aroma and flavor.",
      hsCode: "0901.00",
      incoterm: "FOB",
      minOrderQty: 500,
      leadTimeDays: 14,
      images: [{ mime: "image/jpeg", path: "/uploads/images/2.jpg", filename: "2.jpg" }],
      updatedAt: new Date(),
      producerWalletId: testUser.walletAddress,
    },
  });
  console.log("✅ Created 10 products\n");

  // ----- Orders with IPFS Documents (only using the 10 products above) -----
  console.log("📝 Creating orders...\n");
  const gatewayUrl = process.env.IPFS_GATEWAY_URL || "https://up.storacha.network";

  // Order 1: AWAITING_PAYMENT (Coffee)
  console.log("  Order 1: AWAITING_PAYMENT");
  const order1 = await prisma.order.create({
    data: {
      code: "ORD-2025-000001",
      userId: testUser.id,
      status: OrderStatus.AWAITING_PAYMENT,
      subtotal: 1000 * 3.0,
      shipping: 200,
      total: 1000 * 3.0 + 200,
      buyerBankId: bank1.id,
      sellerBankId: bank2.id,
      items: {
        create: [
          {
            productId: coffee.id,
            quantity: 1000,
            unitPrice: 3.0,
            lineTotal: 1000 * 3.0,
          },
        ],
      },
    },
  });

  // Order 2: BANK_REVIEW (Copper) with pending docs
  console.log("  Order 2: BANK_REVIEW");
  const order2 = await prisma.order.create({
    data: {
      code: "ORD-2025-000002",
      userId: testUser.id,
      status: OrderStatus.BANK_REVIEW,
      subtotal: 3000 * 8.0,
      shipping: 800,
      total: 3000 * 8.0 + 800,
      buyerBankId: bank1.id,
      sellerBankId: bank3.id,
      items: {
        create: [
          {
            productId: copper.id,
            quantity: 3000,
            unitPrice: 8.0,
            lineTotal: 3000 * 8.0,
          },
        ],
      },
    },
  });

  const order2Docs = [
    { cat: "commercial", type: "commercial_invoice", name: "Commercial Invoice" },
    { cat: "commercial", type: "packing_list", name: "Packing List" },
    { cat: "transport", type: "bill_of_lading", name: "Bill of Lading" },
    { cat: "insurance", type: "insurance_policy", name: "Insurance Policy" },
    { cat: "origin_control", type: "certificate_of_origin", name: "Certificate of Origin" },
  ];

  for (const doc of order2Docs) {
    const cid = generateMockCID();
    await prisma.document.create({
      data: {
        userId: producer2.id,
        orderId: order2.id,
        filename: `${doc.name.toLowerCase().replace(/ /g, "_")}_${order2.code}.pdf`,
        cid,
        url: `${gatewayUrl}/ipfs/${cid}`,
        category: doc.cat,
        documentType: DocumentType.OTHER,
        status: DocumentStatus.PENDING,
      },
    });
  }

  // Order 3: IN_TRANSIT (Gold) with validated docs
  console.log("  Order 3: IN_TRANSIT");
  const order3 = await prisma.order.create({
    data: {
      code: "ORD-2025-000003",
      userId: buyer2.id,
      status: OrderStatus.IN_TRANSIT,
      subtotal: 10 * 60000.0,
      shipping: 5000,
      total: 10 * 60000.0 + 5000,
      buyerBankId: bank1.id,
      sellerBankId: bank4.id,
      items: {
        create: [
          {
            productId: gold.id,
            quantity: 10,
            unitPrice: 60000.0,
            lineTotal: 10 * 60000.0,
          },
        ],
      },
    },
  });

  for (const doc of order2Docs) {
    const cid = generateMockCID();
    await prisma.document.create({
      data: {
        userId: producer2.id,
        orderId: order3.id,
        filename: `${doc.name.toLowerCase().replace(/ /g, "_")}_${order3.code}.pdf`,
        cid,
        url: `${gatewayUrl}/ipfs/${cid}`,
        category: doc.cat,
        documentType: DocumentType.OTHER,
        status: DocumentStatus.VALIDATED,
        validatedBy: "John Smith",
        validatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });
  }

  await prisma.bankReview.createMany({
    data: [
      { orderId: order3.id, bankId: bank1.id, action: "approve", comments: "All documents verified" },
      { orderId: order3.id, bankId: bank4.id, action: "approve", comments: "Shipment authorized" },
    ],
  });

  // Order 4: DELIVERED (Tea) with validated docs
  console.log("  Order 4: DELIVERED");
  const order4 = await prisma.order.create({
    data: {
      code: "ORD-2025-000004",
      userId: testUser.id,
      status: OrderStatus.DELIVERED,
      subtotal: 1000 * 2.0,
      shipping: 250,
      total: 1000 * 2.0 + 250,
      buyerBankId: bank1.id,
      sellerBankId: bank2.id,
      items: {
        create: [
          {
            productId: tea.id,
            quantity: 1000,
            unitPrice: 2.0,
            lineTotal: 1000 * 2.0,
          },
        ],
      },
    },
  });

  for (const doc of order2Docs) {
    const cid = generateMockCID();
    await prisma.document.create({
      data: {
        userId: testUser.id,
        orderId: order4.id,
        filename: `${doc.name.toLowerCase().replace(/ /g, "_")}_${order4.code}.pdf`,
        cid,
        url: `${gatewayUrl}/ipfs/${cid}`,
        category: doc.cat,
        documentType: DocumentType.OTHER,
        status: DocumentStatus.VALIDATED,
        validatedBy: "Sophie Martin",
        validatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  await prisma.bankReview.createMany({
    data: [
      { orderId: order4.id, bankId: bank1.id, action: "approve", comments: "Payment released" },
      { orderId: order4.id, bankId: bank2.id, action: "approve", comments: "Transaction completed" },
    ],
  });

  // Order 5: DISPUTED (Diamonds) — mixed doc statuses
  console.log("  Order 5: DISPUTED");
  const order5 = await prisma.order.create({
    data: {
      code: "ORD-2025-000005",
      userId: buyer2.id,
      status: OrderStatus.DISPUTED,
      subtotal: 300 * 1500.0,
      shipping: 3500,
      total: 300 * 1500.0 + 3500,
      buyerBankId: bank1.id,
      sellerBankId: bank4.id,
      items: {
        create: [
          {
            productId: diamonds.id,
            quantity: 300,
            unitPrice: 1500.0,
            lineTotal: 300 * 1500.0,
          },
        ],
      },
    },
  });

  const order5Docs = [
    { cat: "commercial", type: "commercial_invoice", name: "Commercial Invoice", status: DocumentStatus.VALIDATED, reason: undefined },
    { cat: "commercial", type: "packing_list", name: "Packing List", status: DocumentStatus.REJECTED, reason: "Quantities do not match invoice" },
    { cat: "transport", type: "air_waybill", name: "Air Waybill", status: DocumentStatus.PENDING, reason: undefined },
  ];

  for (const doc of order5Docs) {
    const cid = generateMockCID();
    await prisma.document.create({
      data: {
        userId: producer2.id,
        orderId: order5.id,
        filename: `${doc.name.toLowerCase().replace(/ /g, "_")}_${order5.code}.pdf`,
        cid,
        url: `${gatewayUrl}/ipfs/${cid}`,
        category: doc.cat,
        documentType: DocumentType.OTHER,
        status: doc.status,
        validatedBy: doc.status !== DocumentStatus.PENDING ? "John Smith" : undefined,
        validatedAt: doc.status !== DocumentStatus.PENDING
          ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          : undefined,
        rejectionReason: doc.reason,
      },
    });
  }

  // Order 6: CANCELLED (Kente)
  console.log("  Order 6: CANCELLED");
  await prisma.order.create({
    data: {
      code: "ORD-2025-000006",
      userId: buyer2.id,
      status: OrderStatus.CANCELLED,
      subtotal: 740 * 25.0,
      shipping: 600,
      total: 740 * 25.0 + 600,
      buyerBankId: bank3.id,
      sellerBankId: bank3.id,
      items: {
        create: [
          {
            productId: kente.id,
            quantity: 740,
            unitPrice: 25.0,
            lineTotal: 740 * 25.0,
          },
        ],
      },
    },
  });

  console.log("\n✅ Created 6 orders with IPFS documents");
  console.log("\n📊 Summary:");
  console.log("  • 5 Banks");
  console.log("  • 3 Users");
  console.log("  • 10 Products");
  console.log("  • 6 Orders (all statuses)");
  console.log("  • 20+ Documents with IPFS CIDs");
  console.log(`  • Gateway: ${gatewayUrl}`);
  console.log("\n✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
