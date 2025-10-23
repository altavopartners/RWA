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

  // Clean existing data
  console.log("🗑️  Cleaning existing data...");
  await prisma.document.deleteMany();
  await prisma.bankReview.deleteMany();
  await prisma.orderedItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.bank.deleteMany();
  console.log("✅ Database cleaned\n");

  // ----- Banks -----
  console.log("🏦 Creating banks...");
  const usBuyerBank = await prisma.bank.create({
    data: {
      code: "AMTBUS33",
      name: "American Trade Bank",
      country: "USA",
    },
  });
  const usSellerBank = await prisma.bank.create({
    data: {
      code: "PACBUS44",
      name: "Pacific Commerce Bank",
      country: "USA",
    },
  });
  const germanyBank = await prisma.bank.create({
    data: {
      code: "DEHADE5M",
      name: "Deutsche Handelsbank",
      country: "Germany",
    },
  });
  const franceBank = await prisma.bank.create({
    data: {
      code: "BNPAFRPP",
      name: "Banque Commerciale",
      country: "France",
    },
  });
  const japanBank = await prisma.bank.create({
    data: {
      code: "TOTRJPJT",
      name: "Tokyo Trading Bank",
      country: "Japan",
    },
  });
  console.log("✅ Created 5 banks\n");

  // ----- Users (Producers & Buyers) -----
  console.log("👥 Creating users...");

  // US Fruit Producer
  const fruitProducer = await prisma.user.create({
    data: {
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
      fullName: "Green Valley Farms LLC",
      email: "sales@greenvalley.com",
      userType: UserType.PRODUCER,
      isVerified: true,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  // German Meat Producer
  const meatProducer = await prisma.user.create({
    data: {
      walletAddress: "0x2345678901bcdef2345678901bcdef234567890",
      fullName: "Bavaria Meat GmbH",
      email: "export@bavariameat.de",
      userType: UserType.PRODUCER,
      isVerified: true,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  // Japanese Electronics Producer
  const electronicsProducer = await prisma.user.create({
    data: {
      walletAddress: "0x3456789012cdef3456789012cdef345678901234",
      fullName: "Tokyo Tech Industries",
      email: "trade@tokyotech.jp",
      userType: UserType.PRODUCER,
      isVerified: true,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  // French Buyer (Restaurant Chain)
  const restaurantBuyer = await prisma.user.create({
    data: {
      walletAddress: "0x4567890123def4567890123def456789012345",
      fullName: "Le Gourmet Restaurants SA",
      email: "procurement@legourmet.fr",
      userType: UserType.BUYER,
      isVerified: true,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  // US Buyer (Electronics Retailer)
  const retailBuyer = await prisma.user.create({
    data: {
      walletAddress: "0x5678901234ef5678901234ef567890123456",
      fullName: "TechMart Retail Inc",
      email: "purchasing@techmart.com",
      userType: UserType.BUYER,
      isVerified: true,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  // Buyer with pending KYC
  const pendingBuyer = await prisma.user.create({
    data: {
      walletAddress: "0x6789012345f6789012345f6789012345678",
      fullName: "New Trading Company",
      email: "contact@newtrade.com",
      userType: UserType.BUYER,
      isVerified: false,
      kycStatus: KycStatus.PENDING,
    },
  });

  console.log("✅ Created 6 users (3 producers, 3 buyers)\n");

  // ----- Products -----
  console.log("📦 Creating products...");

  // Fruit Products
  const apples = await prisma.product.create({
    data: {
      name: "Organic Washington Apples",
      quantity: 5000,
      unit: "kg",
      pricePerUnit: 3.5,
      countryOfOrigin: "USA",
      category: "Fruits",
      description: "Premium organic apples from Washington State orchards",
      producerWalletId: fruitProducer.walletAddress,
    },
  });

  const oranges = await prisma.product.create({
    data: {
      name: "California Valencia Oranges",
      quantity: 3000,
      unit: "kg",
      pricePerUnit: 2.75,
      countryOfOrigin: "USA",
      category: "Fruits",
      description: "Fresh Valencia oranges, perfect for juice",
      producerWalletId: fruitProducer.walletAddress,
    },
  });

  // Meat Products
  const beef = await prisma.product.create({
    data: {
      name: "Certified Halal Beef",
      quantity: 2000,
      unit: "kg",
      pricePerUnit: 15.0,
      countryOfOrigin: "Germany",
      category: "Meat",
      description: "Premium Halal-certified beef cuts from Bavaria",
      producerWalletId: meatProducer.walletAddress,
    },
  });

  const lamb = await prisma.product.create({
    data: {
      name: "Organic Lamb Meat",
      quantity: 1000,
      unit: "kg",
      pricePerUnit: 18.5,
      countryOfOrigin: "Germany",
      category: "Meat",
      description: "Free-range organic lamb from German farms",
      producerWalletId: meatProducer.walletAddress,
    },
  });

  // Electronics Products
  const laptops = await prisma.product.create({
    data: {
      name: "Professional Laptops X1",
      quantity: 500,
      unit: "units",
      pricePerUnit: 1200.0,
      countryOfOrigin: "Japan",
      category: "Electronics",
      description: "High-performance business laptops",
      producerWalletId: electronicsProducer.walletAddress,
    },
  });

  const tablets = await prisma.product.create({
    data: {
      name: "HD Tablets Pro",
      quantity: 1000,
      unit: "units",
      pricePerUnit: 450.0,
      countryOfOrigin: "Japan",
      category: "Electronics",
      description: "10-inch HD tablets with stylus support",
      producerWalletId: electronicsProducer.walletAddress,
    },
  });

  console.log("✅ Created 6 products\n");

  // ----- Orders with IPFS Documents -----
  console.log("📝 Creating orders...\n");
  const gatewayUrl =
    process.env.IPFS_GATEWAY_URL || "https://up.storacha.network";

  // Order 1: AWAITING_PAYMENT
  console.log("  Order 1: AWAITING_PAYMENT");
  const order1 = await prisma.order.create({
    data: {
      code: "ORD-2025-000001",
      userId: restaurantBuyer.id,
      status: OrderStatus.AWAITING_PAYMENT,
      subtotal: 17500,
      shipping: 500,
      total: 18000,
      buyerBankId: franceBank.id,
      sellerBankId: usSellerBank.id,
      items: {
        create: [
          {
            productId: apples.id,
            quantity: 5000,
            unitPrice: 3.5,
            lineTotal: 17500,
          },
        ],
      },
    },
  });

  // Order 2: BANK_REVIEW with pending documents
  console.log("  Order 2: BANK_REVIEW");
  const order2 = await prisma.order.create({
    data: {
      code: "ORD-2025-000002",
      userId: restaurantBuyer.id,
      status: OrderStatus.BANK_REVIEW,
      subtotal: 30000,
      shipping: 800,
      total: 30800,
      buyerBankId: franceBank.id,
      sellerBankId: germanyBank.id,
      items: {
        create: [
          {
            productId: beef.id,
            quantity: 2000,
            unitPrice: 15.0,
            lineTotal: 30000,
          },
        ],
      },
    },
  });

  // Documents for Order 2
  const order2Docs = [
    {
      cat: "commercial",
      type: "commercial_invoice",
      name: "Commercial Invoice",
    },
    { cat: "commercial", type: "packing_list", name: "Packing List" },
    { cat: "transport", type: "bill_of_lading", name: "Bill of Lading" },
    { cat: "insurance", type: "insurance_policy", name: "Insurance Policy" },
    {
      cat: "origin_control",
      type: "certificate_of_origin",
      name: "Certificate of Origin",
    },
  ];

  for (const doc of order2Docs) {
    const cid = generateMockCID();
    await prisma.document.create({
      data: {
        userId: meatProducer.id,
        orderId: order2.id,
        filename: `${doc.name.toLowerCase().replace(/ /g, "_")}_${
          order2.code
        }.pdf`,
        cid: cid,
        url: `${gatewayUrl}/ipfs/${cid}`,
        category: doc.cat,
        documentType: DocumentType.OTHER,
        status: DocumentStatus.PENDING,
      },
    });
  }

  // Order 3: IN_TRANSIT with validated documents
  console.log("  Order 3: IN_TRANSIT");
  const order3 = await prisma.order.create({
    data: {
      code: "ORD-2025-000003",
      userId: retailBuyer.id,
      status: OrderStatus.IN_TRANSIT,
      subtotal: 600000,
      shipping: 5000,
      total: 605000,
      buyerBankId: usBuyerBank.id,
      sellerBankId: japanBank.id,
      items: {
        create: [
          {
            productId: laptops.id,
            quantity: 500,
            unitPrice: 1200.0,
            lineTotal: 600000,
          },
        ],
      },
    },
  });

  // Validated documents for Order 3
  for (const doc of order2Docs) {
    const cid = generateMockCID();
    await prisma.document.create({
      data: {
        userId: electronicsProducer.id,
        orderId: order3.id,
        filename: `${doc.name.toLowerCase().replace(/ /g, "_")}_${
          order3.code
        }.pdf`,
        cid: cid,
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
      {
        orderId: order3.id,
        bankId: usBuyerBank.id,
        action: "approve",
        comments: "All documents verified",
      },
      {
        orderId: order3.id,
        bankId: japanBank.id,
        action: "approve",
        comments: "Shipment authorized",
      },
    ],
  });

  // Order 4: DELIVERED
  console.log("  Order 4: DELIVERED");
  const order4 = await prisma.order.create({
    data: {
      code: "ORD-2025-000004",
      userId: restaurantBuyer.id,
      status: OrderStatus.DELIVERED,
      subtotal: 8250,
      shipping: 250,
      total: 8500,
      buyerBankId: franceBank.id,
      sellerBankId: usSellerBank.id,
      items: {
        create: [
          {
            productId: oranges.id,
            quantity: 3000,
            unitPrice: 2.75,
            lineTotal: 8250,
          },
        ],
      },
    },
  });

  for (const doc of order2Docs) {
    const cid = generateMockCID();
    await prisma.document.create({
      data: {
        userId: fruitProducer.id,
        orderId: order4.id,
        filename: `${doc.name.toLowerCase().replace(/ /g, "_")}_${
          order4.code
        }.pdf`,
        cid: cid,
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
      {
        orderId: order4.id,
        bankId: franceBank.id,
        action: "approve",
        comments: "Payment released",
      },
      {
        orderId: order4.id,
        bankId: usSellerBank.id,
        action: "approve",
        comments: "Transaction completed",
      },
    ],
  });

  // Order 5: DISPUTED with mixed doc statuses
  console.log("  Order 5: DISPUTED");
  const order5 = await prisma.order.create({
    data: {
      code: "ORD-2025-000005",
      userId: retailBuyer.id,
      status: OrderStatus.DISPUTED,
      subtotal: 450000,
      shipping: 3500,
      total: 453500,
      buyerBankId: usBuyerBank.id,
      sellerBankId: japanBank.id,
      items: {
        create: [
          {
            productId: tablets.id,
            quantity: 1000,
            unitPrice: 450.0,
            lineTotal: 450000,
          },
        ],
      },
    },
  });

  // Mixed status documents
  const order5Docs = [
    {
      cat: "commercial",
      type: "commercial_invoice",
      name: "Commercial Invoice",
      status: DocumentStatus.VALIDATED,
      reason: undefined,
    },
    {
      cat: "commercial",
      type: "packing_list",
      name: "Packing List",
      status: DocumentStatus.REJECTED,
      reason: "Quantities do not match invoice",
    },
    {
      cat: "transport",
      type: "air_waybill",
      name: "Air Waybill",
      status: DocumentStatus.PENDING,
      reason: undefined,
    },
  ];

  for (const doc of order5Docs) {
    const cid = generateMockCID();
    await prisma.document.create({
      data: {
        userId: electronicsProducer.id,
        orderId: order5.id,
        filename: `${doc.name.toLowerCase().replace(/ /g, "_")}_${
          order5.code
        }.pdf`,
        cid: cid,
        url: `${gatewayUrl}/ipfs/${cid}`,
        category: doc.cat,
        documentType: DocumentType.OTHER,
        status: doc.status,
        validatedBy:
          doc.status !== DocumentStatus.PENDING ? "John Smith" : undefined,
        validatedAt:
          doc.status !== DocumentStatus.PENDING
            ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            : undefined,
        rejectionReason: doc.reason,
      },
    });
  }

  // Order 6: CANCELLED
  console.log("  Order 6: CANCELLED");
  await prisma.order.create({
    data: {
      code: "ORD-2025-000006",
      userId: pendingBuyer.id,
      status: OrderStatus.CANCELLED,
      subtotal: 18500,
      shipping: 600,
      total: 19100,
      buyerBankId: germanyBank.id,
      sellerBankId: germanyBank.id,
      items: {
        create: [
          {
            productId: lamb.id,
            quantity: 1000,
            unitPrice: 18.5,
            lineTotal: 18500,
          },
        ],
      },
    },
  });

  console.log("\n✅ Created 6 orders with IPFS documents");
  console.log("\n📊 Summary:");
  console.log("  • 5 Banks");
  console.log("  • 6 Users (3 producers, 3 buyers)");
  console.log("  • 6 Products");
  console.log("  • 6 Orders (all statuses)");
  console.log("  • 20+ Documents with IPFS CIDs");
  console.log(`  • Gateway: ${gatewayUrl}`);
  console.log("\n✅ Database seeded successfully!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
