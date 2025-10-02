import {
  PrismaClient,
  OrderStatus,
  DocumentStatus,
  DocumentType,
  UserType,
  KycStatus,
} from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // ----- Banks -----
  const bank1 = await prisma.bank.create({
    data: { name: "Global Bank", swiftCode: "GB001", country: "USA" },
  });
  const bank2 = await prisma.bank.create({
    data: { name: "Continental Bank", swiftCode: "CB002", country: "Germany" },
  });

  // ----- Users -----
  const producer = await prisma.user.create({
    data: {
      walletAddress: "0xProducerWallet",
      fullName: "Alice Producer",
      email: "alice@producer.com",
      userType: UserType.PRODUCER,
      isVerified: true,
      bankId: bank1.id,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  const buyer = await prisma.user.create({
    data: {
      walletAddress: "0xBuyerWallet",
      fullName: "Bob Buyer",
      email: "bob@buyer.com",
      userType: UserType.BUYER,
      bankId: bank2.id,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  // ----- Products -----
  const product1 = await prisma.product.create({
    data: {
      name: "Organic Apples",
      quantity: 1000,
      unit: "kg",
      pricePerUnit: 2.5,
      countryOfOrigin: "USA",
      category: "Fruits",
      description: "Fresh organic apples from Washington",
      producerWalletId: producer.walletAddress,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: "Halal Beef",
      quantity: 500,
      unit: "kg",
      pricePerUnit: 8.0,
      countryOfOrigin: "Germany",
      category: "Meat",
      description: "Certified Halal beef cuts",
      producerWalletId: producer.walletAddress,
    },
  });

  // ----- Orders covering all statuses -----
  const statuses: OrderStatus[] = [
    OrderStatus.AWAITING_PAYMENT,
    OrderStatus.BANK_REVIEW,
    OrderStatus.IN_TRANSIT,
    OrderStatus.DELIVERED,
    OrderStatus.DISPUTED,
    OrderStatus.CANCELLED,
  ];

  for (let i = 0; i < statuses.length; i++) {
    const order = await prisma.order.create({
      data: {
        code: `ORD-00${i + 1}`,
        userId: buyer.id,
        status: statuses[i],
        subtotal: 1000,
        shipping: 50,
        total: 1050,
        buyerBankId: bank2.id,
        sellerBankId: bank1.id,
        items: {
          create: [
            {
              productId: product1.id,
              quantity: 100,
              unitPrice: 2.5,
              lineTotal: 250,
            },
            {
              productId: product2.id,
              quantity: 50,
              unitPrice: 8.0,
              lineTotal: 400,
            },
          ],
        },
      },
    });

    // Attach documents
    await prisma.document.createMany({
      data: [
        {
          userId: producer.id,
          orderId: order.id,
          filename: `producer_doc_${i + 1}.pdf`,
          cid: `QmProducerDoc${i + 1}`,
          url: `https://example.com/producer_doc_${i + 1}.pdf`,
          documentType: DocumentType.KYC_ID,
          status:
            i % 2 === 0 ? DocumentStatus.VALIDATED : DocumentStatus.PENDING,
        },
        {
          userId: buyer.id,
          orderId: order.id,
          filename: `buyer_doc_${i + 1}.pdf`,
          cid: `QmBuyerDoc${i + 1}`,
          url: `https://example.com/buyer_doc_${i + 1}.pdf`,
          documentType: DocumentType.KYC_ID,
          status:
            i % 2 === 0 ? DocumentStatus.VALIDATED : DocumentStatus.PENDING,
        },
      ],
    });

    // Bank reviews for certain statuses
    if (
      statuses[i] === OrderStatus.IN_TRANSIT ||
      statuses[i] === OrderStatus.DELIVERED
    ) {
      await prisma.bankReview.createMany({
        data: [
          {
            orderId: order.id,
            bankId: bank1.id,
            action: "approve",
            comments: "Seller bank approved",
          },
          {
            orderId: order.id,
            bankId: bank2.id,
            action: "approve",
            comments: "Buyer bank approved",
          },
        ],
      });
    }
  }

  console.log("✅ Database seeded with valid order statuses!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
