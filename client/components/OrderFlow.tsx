"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Lock,
  Truck,
  CheckCircle,
  Clock,
  Package,
  Shield,
  AlertCircle,
  MapPin,
  DollarSign,
  FileCheck,
} from "lucide-react";

const OrderFlow = () => {
  const [selectedOrder, setSelectedOrder] = useState("1");

  const mockOrders = [
    {
      id: "1",
      orderId: "ORD-2024-001",
      productName: "Premium Ghanaian Cocoa Beans",
      producer: "Kwame Farms",
      quantity: 500,
      unitPrice: 2.5,
      totalAmount: 1250,
      escrowAmount: 1250,
      status: "bank_verification",
      progress: 40,
      orderDate: "2024-01-15",
      estimatedDelivery: "2024-02-15",
      trackingNumber: null,
      buyerAddress: "0x8765...4321",
      producerAddress: "0x1234...5678",
      escrowContract: "0.0.789012",
      buyerBank: {
        id: "BNK001",
        name: "Compliance Bank Ltd",
        status: "pending_documents",
        documentsRequested: [
          "ID verification",
          "Trade license",
          "Import permits",
        ],
        lastUpdate: "2024-01-16",
      },
      sellerBank: {
        id: "GCB001",
        name: "Ghana Commercial Bank",
        status: "documents_submitted",
        documentsRequested: [
          "Export license",
          "Product certificates",
          "Shipping documentation",
        ],
        lastUpdate: "2024-01-17",
      },
      milestones: [
        {
          stage: "Order Placed",
          completed: true,
          date: "2024-01-15",
          description: "Order confirmed and sent to banks for verification",
        },
        {
          stage: "Bank Verification",
          completed: false,
          date: null,
          description:
            "Both banks verifying client documents and approving escrow",
        },
        {
          stage: "Escrow Approved",
          completed: false,
          date: null,
          description: "Both banks approved - funds locked in Hedera escrow",
        },
        {
          stage: "Production",
          completed: false,
          date: null,
          description: "Product prepared and certified",
        },
        {
          stage: "Shipped",
          completed: false,
          date: null,
          description: "50% released to seller on shipment",
        },
        {
          stage: "In Transit",
          completed: false,
          date: null,
          description: "Package in transit to buyer",
        },
        {
          stage: "Delivered",
          completed: false,
          date: null,
          description: "Remaining 50% released on delivery confirmation",
        },
      ],
      paymentSchedule: {
        onApproval: 0,
        onShipment: 50,
        onDelivery: 50,
      },
    },
    {
      id: "2",
      orderId: "ORD-2024-002",
      productName: "Authentic Kente Cloth",
      producer: "Adoma Textiles",
      quantity: 5,
      unitPrice: 150,
      totalAmount: 750,
      escrowAmount: 750,
      status: "ready_for_shipment",
      progress: 60,
      orderDate: "2024-01-20",
      estimatedDelivery: "2024-02-20",
      trackingNumber: "HEX987654321",
      buyerAddress: "0x8765...4321",
      producerAddress: "0x2345...6789",
      escrowContract: "0.0.345678",
      buyerBank: {
        id: "BNK001",
        name: "Compliance Bank Ltd",
        status: "approved",
        documentsRequested: [],
        lastUpdate: "2024-01-21",
      },
      sellerBank: {
        id: "ECO001",
        name: "Ecobank Ghana",
        status: "approved",
        documentsRequested: [],
        lastUpdate: "2024-01-21",
      },
      milestones: [
        {
          stage: "Order Placed",
          completed: true,
          date: "2024-01-20",
          description: "Order confirmed and sent to banks for verification",
        },
        {
          stage: "Bank Verification",
          completed: true,
          date: "2024-01-21",
          description: "Both banks verified documents and approved escrow",
        },
        {
          stage: "Escrow Approved",
          completed: true,
          date: "2024-01-21",
          description: "Funds locked in Hedera escrow - ready for production",
        },
        {
          stage: "Production",
          completed: true,
          date: "2024-01-23",
          description: "Weaving completed and quality verified",
        },
        {
          stage: "Shipped",
          completed: false,
          date: null,
          description: "Ready for shipment - 50% will release on confirmation",
        },
        {
          stage: "In Transit",
          completed: false,
          date: null,
          description: "Package in transit to buyer",
        },
        {
          stage: "Delivered",
          completed: false,
          date: null,
          description: "Remaining 50% released on delivery confirmation",
        },
      ],
      paymentSchedule: {
        onApproval: 0,
        onShipment: 50,
        onDelivery: 50,
      },
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "bank_verification":
        return "bg-warning";
      case "ready_for_shipment":
        return "bg-info";
      case "in_transit":
        return "bg-info";
      case "delivered":
        return "bg-success";
      case "disputed":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "bank_verification":
        return Shield;
      case "ready_for_shipment":
        return Package;
      case "in_transit":
        return Truck;
      case "delivered":
        return CheckCircle;
      case "disputed":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getBankStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-success text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "verified":
        return (
          <Badge className="bg-info text-white">
            <FileCheck className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "documents_submitted":
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Under Review
          </Badge>
        );
      case "pending_documents":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Docs Needed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const currentOrder = mockOrders.find((order) => order.id === selectedOrder)!;
  const StatusIcon = getStatusIcon(currentOrder.status);

  const handleConfirmDelivery = () => {
    // In real implementation, this would trigger smart contract function
    console.log("Confirming delivery and releasing escrow...");
  };

  const handleDispute = () => {
    // In real implementation, this would trigger dispute resolution
    console.log("Opening dispute resolution...");
  };

  return (
    <div className="pt-20 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">
            Track your orders and manage escrow payments
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-1">
            <Card className="glass border-border/50 p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {mockOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status);
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order.id)}
                      className={`p-4 rounded-lg cursor-pointer transition-smooth border ${
                        selectedOrder === order.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {order.orderId}
                        </span>
                        <StatusIcon className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {order.productName}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={getStatusColor(order.status)}
                        >
                          {order.status.replace("_", " ")}
                        </Badge>
                        <span className="text-sm font-medium ">
                          ${order.totalAmount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Main Order Info */}
              <div className="xl:col-span-2 space-y-6">
                {/* Order Header */}
                <Card className="glass border-border/50 p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        {currentOrder.orderId}
                      </h2>
                      <p className="text-muted-foreground">
                        {currentOrder.productName}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(
                        currentOrder.status
                      )} text-white`}
                    >
                      <StatusIcon className="w-4 h-4 mr-2" />
                      {currentOrder.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-semibold">
                        {currentOrder.quantity} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Unit Price
                      </p>
                      <p className="font-semibold">${currentOrder.unitPrice}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Amount
                      </p>
                      <p className="font-semibold ">
                        ${currentOrder.totalAmount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="font-semibold">{currentOrder.progress}%</p>
                    </div>
                  </div>

                  <Progress value={currentOrder.progress} className="mb-4" />

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Ordered: {currentOrder.orderDate}</span>
                    <span>Est. Delivery: {currentOrder.estimatedDelivery}</span>
                  </div>
                </Card>

                {/* Tracking Timeline */}
                <Card className="glass border-border/50 p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center">
                    <Truck className="w-5 h-5 mr-2" />
                    Order Timeline
                  </h3>

                  <div className="space-y-4">
                    {currentOrder.milestones.map((milestone, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div
                          className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 ${
                            milestone.completed ? "bg-success" : "bg-muted"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4
                              className={`font-medium ${
                                milestone.completed
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {milestone.stage}
                            </h4>
                            {milestone.date && (
                              <span className="text-sm text-muted-foreground">
                                {milestone.date}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {milestone.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {currentOrder.trackingNumber && (
                    <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium mb-1">
                        Tracking Number
                      </p>
                      <p className="font-mono text-sm">
                        {currentOrder.trackingNumber}
                      </p>
                    </div>
                  )}
                </Card>

                {/* Bank Approval Status */}
                {(currentOrder.status === "bank_verification" ||
                  currentOrder.status === "ready_for_shipment") && (
                  <Card className="glass border-border/50 p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Dual-Bank Approval Status
                    </h3>

                    <div className="space-y-4">
                      {/* Buyer's Bank */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">Buyer's Bank</h4>
                            <p className="text-sm text-muted-foreground">
                              {currentOrder.buyerBank.name}
                            </p>
                          </div>
                          {getBankStatusBadge(currentOrder.buyerBank.status)}
                        </div>

                        {currentOrder.buyerBank.documentsRequested.length >
                          0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Required Documents:
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {currentOrder.buyerBank.documentsRequested.map(
                                (doc, index) => (
                                  <li
                                    key={index}
                                    className="flex items-center gap-2"
                                  >
                                    <div className="w-1.5 h-1.5 bg-warning rounded-full" />
                                    {doc}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          Last updated: {currentOrder.buyerBank.lastUpdate}
                        </p>
                      </div>

                      {/* Seller's Bank */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">Seller's Bank</h4>
                            <p className="text-sm text-muted-foreground">
                              {currentOrder.sellerBank.name}
                            </p>
                          </div>
                          {getBankStatusBadge(currentOrder.sellerBank.status)}
                        </div>

                        {currentOrder.sellerBank.documentsRequested.length >
                          0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Required Documents:
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {currentOrder.sellerBank.documentsRequested.map(
                                (doc, index) => (
                                  <li
                                    key={index}
                                    className="flex items-center gap-2"
                                  >
                                    <div className="w-1.5 h-1.5 bg-warning rounded-full" />
                                    {doc}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          Last updated: {currentOrder.sellerBank.lastUpdate}
                        </p>
                      </div>

                      {/* Overall Status */}
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm">
                          {currentOrder.buyerBank.status === "approved" &&
                          currentOrder.sellerBank.status === "approved"
                            ? "✅ Both banks approved - escrow active and ready for shipment"
                            : "⏳ Waiting for both banks to complete verification and approval process"}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Escrow Details */}
                <Card className="glass border-border/50 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Hedera Escrow Details
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Escrow Amount
                      </p>
                      <p className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                        ${currentOrder.escrowAmount}
                      </p>
                    </div>

                    {/* Payment Schedule */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Payment Schedule
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>On Bank Approval:</span>
                          <span className="font-medium">
                            {currentOrder.paymentSchedule.onApproval}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>On Shipment:</span>
                          <span className="font-medium text-warning">
                            {currentOrder.paymentSchedule.onShipment}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>On Delivery:</span>
                          <span className="font-medium text-success">
                            {currentOrder.paymentSchedule.onDelivery}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Hedera Contract
                      </p>
                      <p className="font-mono text-sm break-all">
                        {currentOrder.escrowContract}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Escrow Status
                      </p>
                      <div className="flex items-center gap-2">
                        {currentOrder.buyerBank.status === "approved" &&
                        currentOrder.sellerBank.status === "approved" ? (
                          <>
                            <Lock className="w-4 h-4 text-success" />
                            <span className="text-sm text-success">
                              Funds Secured & Active
                            </span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-warning" />
                            <span className="text-sm text-warning">
                              Pending Bank Approval
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Actions */}
                <Card className="glass border-border/50 p-6">
                  <h3 className="text-lg font-semibold mb-4">Actions</h3>

                  <div className="space-y-3">
                    {currentOrder.status === "in_transit" && (
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={handleConfirmDelivery}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Delivery
                      </Button>
                    )}

                    <Button variant="outline" className="w-full bg-transparent">
                      <MapPin className="w-4 h-4 mr-2" />
                      Track Package
                    </Button>

                    <Button variant="outline" className="w-full bg-transparent">
                      <FileCheck className="w-4 h-4 mr-2" />
                      View Certificate
                    </Button>

                    {currentOrder.status !== "delivered" && (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleDispute}
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Open Dispute
                      </Button>
                    )}
                  </div>
                </Card>

                {/* Producer Info */}
                <Card className="glass border-border/50 p-6">
                  <h3 className="text-lg font-semibold mb-4">Producer</h3>

                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{currentOrder.producer}</p>
                      <p className="text-sm text-muted-foreground">
                        Verified Producer
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Wallet Address
                      </p>
                      <p className="font-mono text-sm break-all">
                        {currentOrder.producerAddress}
                      </p>
                    </div>

                    <Button variant="outline" className="w-full bg-transparent">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Contact Producer
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFlow;
