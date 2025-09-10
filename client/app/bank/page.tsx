"use client";

import { useState } from "react";
import { BankHeader } from "@/components/bank-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  FileText,
  Shield,
  Scale,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  DollarSign,
  Package,
  Building2,
  User,
  Calendar,
} from "lucide-react";

interface Order {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  buyerBank: string;
  sellerId: string;
  sellerName: string;
  sellerBank: string;
  amount: number;
  currency: string;
  items: string[];
  status:
    | "pending_bank_review"
    | "buyer_docs_requested"
    | "seller_docs_requested"
    | "buyer_docs_verified"
    | "seller_docs_verified"
    | "banks_approved"
    | "shipped_50_released"
    | "received_100_released"
    | "completed"
    | "disputed"
    | "cancelled";
  createdAt: string;
  updatedAt: string;
  escrowAddress?: string;
  hederaTransactionId?: string;
  shipmentTrackingId?: string;
  documentsRequired: {
    buyer: string[];
    seller: string[];
  };
  documentsSubmitted: {
    buyer: string[];
    seller: string[];
  };
  bankApprovals: {
    buyerBank: boolean;
    sellerBank: boolean;
  };
  paymentReleases: {
    partial50: {
      released: boolean;
      amount: number;
      transactionId?: string;
      releasedAt?: string;
    };
    full100: {
      released: boolean;
      amount: number;
      transactionId?: string;
      releasedAt?: string;
    };
  };
}

// Mock data for demonstration
const mockOrders: Order[] = [
  {
    id: "1",
    orderId: "ORD-2024-001",
    buyerId: "buyer1",
    buyerName: "Global Imports LLC",
    buyerBank: "First National Bank",
    sellerId: "seller1",
    sellerName: "Premium Coffee Exports",
    sellerBank: "International Trade Bank",
    amount: 125000,
    currency: "USD",
    items: ["Premium Arabica Coffee - 1000kg", "Organic Certification"],
    status: "buyer_docs_requested",
    createdAt: "2024-01-20T10:30:00Z",
    updatedAt: "2024-01-20T11:15:00Z",
    escrowAddress: "0.0.123456",
    documentsRequired: {
      buyer: ["ID Verification", "Proof of Funds", "Import License"],
      seller: ["Business License", "Export Permit", "Quality Certificate"],
    },
    documentsSubmitted: {
      buyer: ["ID Verification"],
      seller: [],
    },
    bankApprovals: {
      buyerBank: false,
      sellerBank: false,
    },
    paymentReleases: {
      partial50: { released: false, amount: 62500 },
      full100: { released: false, amount: 125000 },
    },
  },
  {
    id: "2",
    orderId: "ORD-2024-002",
    buyerId: "buyer2",
    buyerName: "Tech Solutions Inc",
    buyerBank: "First National Bank",
    sellerId: "seller2",
    sellerName: "Electronics Manufacturing Co",
    sellerBank: "Commerce Bank",
    amount: 75000,
    currency: "USD",
    items: ["Industrial Sensors - 500 units", "Installation Kit"],
    status: "banks_approved",
    createdAt: "2024-01-19T14:20:00Z",
    updatedAt: "2024-01-20T09:45:00Z",
    escrowAddress: "0.0.789012",
    hederaTransactionId: "0.0.123456@1642678901.123456789",
    documentsRequired: {
      buyer: ["Corporate Registration", "Purchase Authorization"],
      seller: ["Manufacturing License", "Quality Assurance Certificate"],
    },
    documentsSubmitted: {
      buyer: ["Corporate Registration", "Purchase Authorization"],
      seller: ["Manufacturing License", "Quality Assurance Certificate"],
    },
    bankApprovals: {
      buyerBank: true,
      sellerBank: true,
    },
    paymentReleases: {
      partial50: { released: false, amount: 37500 },
      full100: { released: false, amount: 75000 },
    },
  },
  {
    id: "3",
    orderId: "ORD-2024-003",
    buyerId: "buyer3",
    buyerName: "Retail Chain Corp",
    buyerBank: "First National Bank",
    sellerId: "seller3",
    sellerName: "Textile Manufacturers Ltd",
    sellerBank: "Trade Finance Bank",
    amount: 200000,
    currency: "USD",
    items: ["Cotton Fabric - 2000 yards", "Custom Dye Patterns"],
    status: "shipped_50_released",
    createdAt: "2024-01-18T08:15:00Z",
    updatedAt: "2024-01-20T16:30:00Z",
    escrowAddress: "0.0.345678",
    hederaTransactionId: "0.0.123456@1642678901.987654321",
    shipmentTrackingId: "TRK-2024-003-ABC",
    documentsRequired: {
      buyer: ["Retail License", "Credit Verification"],
      seller: ["Textile Export License", "Origin Certificate"],
    },
    documentsSubmitted: {
      buyer: ["Retail License", "Credit Verification"],
      seller: ["Textile Export License", "Origin Certificate"],
    },
    bankApprovals: {
      buyerBank: true,
      sellerBank: true,
    },
    paymentReleases: {
      partial50: {
        released: true,
        amount: 100000,
        transactionId: "0.0.123456@1642678901.111111111",
        releasedAt: "2024-01-20T16:30:00Z",
      },
      full100: { released: false, amount: 200000 },
    },
  },
];

function getStatusBadge(status: Order["status"]) {
  const statusConfig = {
    pending_bank_review: {
      label: "Pending Bank Review",
      variant: "outline" as const,
      icon: Clock,
    },
    buyer_docs_requested: {
      label: "Buyer Docs Requested",
      variant: "secondary" as const,
      icon: FileText,
    },
    seller_docs_requested: {
      label: "Seller Docs Requested",
      variant: "secondary" as const,
      icon: FileText,
    },
    buyer_docs_verified: {
      label: "Buyer Docs Verified",
      variant: "outline" as const,
      icon: CheckCircle,
    },
    seller_docs_verified: {
      label: "Seller Docs Verified",
      variant: "outline" as const,
      icon: CheckCircle,
    },
    banks_approved: {
      label: "Banks Approved",
      variant: "default" as const,
      icon: Shield,
    },
    shipped_50_released: {
      label: "Shipped (50% Released)",
      variant: "default" as const,
      icon: Package,
    },
    received_100_released: {
      label: "Received (100% Released)",
      variant: "default" as const,
      icon: CheckCircle,
    },
    completed: {
      label: "Completed",
      variant: "default" as const,
      icon: CheckCircle,
    },
    disputed: {
      label: "Disputed",
      variant: "destructive" as const,
      icon: AlertTriangle,
    },
    cancelled: {
      label: "Cancelled",
      variant: "destructive" as const,
      icon: XCircle,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

function OrderDetailsCard({ order }: { order: Order }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleBankAction = async (
    action: "request_docs" | "approve" | "reject",
    party: "buyer" | "seller"
  ) => {
    console.log(
      `[v0] Bank action: ${action} for ${party} in order ${order.orderId}`
    );
    // In real implementation, this would call the Hedera escrow API
  };

  const handleHederaApproval = async () => {
    console.log(
      `[v0] Sending approval to Hedera escrow contract: ${order.escrowAddress}`
    );
    // This would integrate with Hedera SDK to send approval transaction
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              {order.orderId}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {order.currency} {order.amount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(order.status)}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Parties Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                <span className="font-medium">Buyer</span>
              </div>
              <p className="text-sm">{order.buyerName}</p>
              <p className="text-xs text-muted-foreground">
                Bank: {order.buyerBank}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4" />
                <span className="font-medium">Seller</span>
              </div>
              <p className="text-sm">{order.sellerName}</p>
              <p className="text-xs text-muted-foreground">
                Bank: {order.sellerBank}
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="font-medium mb-2">Order Items</h4>
            <ul className="text-sm space-y-1">
              {order.items.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Document Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Buyer Documents</h4>
              <div className="space-y-1">
                {order.documentsRequired.buyer.map((doc, index) => {
                  const isSubmitted =
                    order.documentsSubmitted.buyer.includes(doc);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      {isSubmitted ? (
                        <CheckCircle className="w-3 h-3 text-chart-5" />
                      ) : (
                        <Clock className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span
                        className={
                          isSubmitted ? "text-chart-5" : "text-muted-foreground"
                        }
                      >
                        {doc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Seller Documents</h4>
              <div className="space-y-1">
                {order.documentsRequired.seller.map((doc, index) => {
                  const isSubmitted =
                    order.documentsSubmitted.seller.includes(doc);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      {isSubmitted ? (
                        <CheckCircle className="w-3 h-3 text-chart-5" />
                      ) : (
                        <Clock className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span
                        className={
                          isSubmitted ? "text-chart-5" : "text-muted-foreground"
                        }
                      >
                        {doc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bank Approvals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Buyer's Bank Approval</span>
                {order.bankApprovals.buyerBank ? (
                  <CheckCircle className="w-4 h-4 text-chart-5" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{order.buyerBank}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Seller's Bank Approval</span>
                {order.bankApprovals.sellerBank ? (
                  <CheckCircle className="w-4 h-4 text-chart-5" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {order.sellerBank}
              </p>
            </div>
          </div>

          {/* Payment Releases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">50% Release (Shipment)</span>
                {order.paymentReleases.partial50.released ? (
                  <CheckCircle className="w-4 h-4 text-chart-5" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm">
                ${order.paymentReleases.partial50.amount.toLocaleString()}
              </p>
              {order.paymentReleases.partial50.released && (
                <p className="text-xs text-muted-foreground font-mono">
                  {order.paymentReleases.partial50.transactionId}
                </p>
              )}
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">100% Release (Delivery)</span>
                {order.paymentReleases.full100.released ? (
                  <CheckCircle className="w-4 h-4 text-chart-5" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm">
                ${order.paymentReleases.full100.amount.toLocaleString()}
              </p>
              {order.paymentReleases.full100.released && (
                <p className="text-xs text-muted-foreground font-mono">
                  {order.paymentReleases.full100.transactionId}
                </p>
              )}
            </div>
          </div>

          {/* Hedera Integration */}
          {order.escrowAddress && (
            <div className="p-3 bg-chart-1/10 border border-chart-1/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-chart-1" />
                <span className="font-medium">Hedera Escrow Contract</span>
              </div>
              <p className="text-sm font-mono">{order.escrowAddress}</p>
              {order.hederaTransactionId && (
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  Transaction: {order.hederaTransactionId}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {order.status === "pending_bank_review" && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleBankAction("request_docs", "buyer")}
                >
                  Request Buyer Documents
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBankAction("request_docs", "seller")}
                >
                  Request Seller Documents
                </Button>
              </>
            )}

            {(order.status === "buyer_docs_verified" ||
              order.status === "seller_docs_verified") &&
              !order.bankApprovals.buyerBank && (
                <Button size="sm" onClick={handleHederaApproval}>
                  Approve Order (Send to Hedera)
                </Button>
              )}

            {order.status === "banks_approved" && (
              <Button size="sm" variant="outline">
                Initiate Shipment
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function BankDashboard() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [activeTab, setActiveTab] = useState("overview");

  const metrics = {
    pendingKYC: orders.filter(
      (o) =>
        o.status === "buyer_docs_requested" ||
        o.status === "seller_docs_requested"
    ).length,
    documentsQueue: orders.reduce(
      (acc, o) =>
        acc +
        o.documentsRequired.buyer.length +
        o.documentsRequired.seller.length,
      0
    ),
    activeEscrows: orders.filter((o) =>
      ["banks_approved", "shipped_50_released"].includes(o.status)
    ).length,
    openDisputes: orders.filter((o) => o.status === "disputed").length,
    totalValue: orders.reduce((acc, o) => acc + o.amount, 0),
    completedOrders: orders.filter((o) => o.status === "completed").length,
  };

  return (
    <div className="space-y-6 p-6">
      <BankHeader
        title="Hedera Escrow Dashboard"
        description="Monitor orders, document verification, and escrow management with Hedera integration"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reviews
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingKYC}</div>
            <p className="text-xs text-muted-foreground">
              Orders awaiting document verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Escrows
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeEscrows}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-chart-5">
                ${(metrics.totalValue / 1000).toFixed(0)}K
              </span>{" "}
              total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Orders
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.openDisputes}</div>
            <p className="text-xs text-muted-foreground">
              Requiring arbitration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>
            Manage orders through the Hedera escrow workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">All Orders</TabsTrigger>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="active">Active Escrows</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              {orders.map((order) => (
                <OrderDetailsCard key={order.id} order={order} />
              ))}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 mt-6">
              {orders
                .filter((o) =>
                  [
                    "pending_bank_review",
                    "buyer_docs_requested",
                    "seller_docs_requested",
                  ].includes(o.status)
                )
                .map((order) => (
                  <OrderDetailsCard key={order.id} order={order} />
                ))}
            </TabsContent>

            <TabsContent value="active" className="space-y-4 mt-6">
              {orders
                .filter((o) =>
                  ["banks_approved", "shipped_50_released"].includes(o.status)
                )
                .map((order) => (
                  <OrderDetailsCard key={order.id} order={order} />
                ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-6">
              {orders
                .filter((o) =>
                  ["completed", "received_100_released"].includes(o.status)
                )
                .map((order) => (
                  <OrderDetailsCard key={order.id} order={order} />
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
