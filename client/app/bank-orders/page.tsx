"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  FileText,
  Shield,
  Truck,
  DollarSign,
} from "lucide-react";

// Mock data for orders
const orders = [
  {
    id: "ORD-2024-001",
    buyer: {
      name: "Alice Johnson",
      avatar: "/avatars/alice.jpg",
      bank: "First National Bank",
    },
    seller: {
      name: "Bob Smith",
      avatar: "/avatars/bob.jpg",
      bank: "Commerce Bank",
    },
    product: "MacBook Pro 16-inch",
    amount: 2499.99,
    escrowAmount: 2499.99,
    status: "pending_bank_approval",
    buyerBankStatus: "approved",
    sellerBankStatus: "pending",
    documentsSubmitted: 8,
    documentsRequired: 10,
    createdAt: "2024-01-15T10:30:00Z",
    estimatedCompletion: "2024-01-20T10:30:00Z",
  },
  {
    id: "ORD-2024-002",
    buyer: {
      name: "Carol Davis",
      avatar: "/avatars/carol.jpg",
      bank: "Trust Bank",
    },
    seller: {
      name: "David Wilson",
      avatar: "/avatars/david.jpg",
      bank: "Regional Bank",
    },
    product: "iPhone 15 Pro Max",
    amount: 1199.99,
    escrowAmount: 1199.99,
    status: "in_shipment",
    buyerBankStatus: "approved",
    sellerBankStatus: "approved",
    documentsSubmitted: 12,
    documentsRequired: 12,
    createdAt: "2024-01-10T14:20:00Z",
    estimatedCompletion: "2024-01-18T14:20:00Z",
  },
  {
    id: "ORD-2024-003",
    buyer: {
      name: "Eve Martinez",
      avatar: "/avatars/eve.jpg",
      bank: "Metro Bank",
    },
    seller: {
      name: "Frank Brown",
      avatar: "/avatars/frank.jpg",
      bank: "City Bank",
    },
    product: "Gaming Desktop PC",
    amount: 3299.99,
    escrowAmount: 3299.99,
    status: "document_review",
    buyerBankStatus: "pending",
    sellerBankStatus: "pending",
    documentsSubmitted: 6,
    documentsRequired: 14,
    createdAt: "2024-01-12T09:15:00Z",
    estimatedCompletion: "2024-01-25T09:15:00Z",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending_bank_approval":
      return "warning";
    case "document_review":
      return "secondary";
    case "in_shipment":
      return "info";
    case "completed":
      return "success";
    case "disputed":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending_bank_approval":
      return <Clock className="h-4 w-4" />;
    case "document_review":
      return <FileText className="h-4 w-4" />;
    case "in_shipment":
      return <Truck className="h-4 w-4" />;
    case "completed":
      return <CheckCircle className="h-4 w-4" />;
    case "disputed":
      return <XCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

export default function BankOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.seller.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleApproveOrder = (orderId: string) => {
    console.log("[v0] Approving order:", orderId);
    // API call to approve order
  };

  const handleRejectOrder = (orderId: string) => {
    console.log("[v0] Rejecting order:", orderId);
    // API call to reject order
  };

  const handleRequestDocuments = (orderId: string) => {
    console.log("[v0] Requesting additional documents for order:", orderId);
    // API call to request documents
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Order Management
          </h1>
          <p className="text-muted-foreground">
            Review and approve trade orders requiring bank verification
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">-1 from yesterday</p>
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
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+5 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$127.5K</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending_bank_approval">
              Pending Approval
            </SelectItem>
            <SelectItem value="document_review">Document Review</SelectItem>
            <SelectItem value="in_shipment">In Shipment</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Orders</CardTitle>
          <CardDescription>
            Orders requiring bank verification and approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <Avatar className="border-2 border-background">
                      <AvatarImage
                        src={order.buyer.avatar || "/placeholder.svg"}
                      />
                      <AvatarFallback>
                        {order.buyer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="border-2 border-background">
                      <AvatarImage
                        src={order.seller.avatar || "/placeholder.svg"}
                      />
                      <AvatarFallback>
                        {order.seller.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.id}</span>
                      <Badge
                        variant={getStatusColor(order.status) as any}
                        className="flex items-center gap-1"
                      >
                        {getStatusIcon(order.status)}
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.product}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Buyer: {order.buyer.name} ({order.buyer.bank})
                      </span>
                      <span>
                        Seller: {order.seller.name} ({order.seller.bank})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">
                      ${order.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Docs: {order.documentsSubmitted}/{order.documentsRequired}
                    </div>
                    <Progress
                      value={
                        (order.documentsSubmitted / order.documentsRequired) *
                        100
                      }
                      className="w-20 h-2 mt-1"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1">
                        <span>Buyer Bank:</span>
                        <Badge
                          variant={
                            order.buyerBankStatus === "approved"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {order.buyerBankStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Seller Bank:</span>
                        <Badge
                          variant={
                            order.sellerBankStatus === "approved"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {order.sellerBankStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {order.status === "pending_bank_approval" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveOrder(order.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectOrder(order.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {order.documentsSubmitted < order.documentsRequired && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequestDocuments(order.id)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
