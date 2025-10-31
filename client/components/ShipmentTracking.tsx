import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  MapPin,
  Truck,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Globe,
  Thermometer,
  QrCode,
  Clock,
} from "lucide-react";
import { bankApi } from "@/lib/api";
import type { BankOrder } from "@/types/bank";

const ShipmentTracking = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [shipments, setShipments] = useState<BankOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders with IN_TRANSIT or DELIVERED status
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        setError(null);
        const orders = await bankApi.getOrders();

        // Filter orders that are in transit or delivered
        const activeShipments = orders.filter(
          (order) =>
            order.status === "IN_TRANSIT" || order.status === "DELIVERED"
        );

        setShipments(activeShipments);

        // Auto-select first shipment if available
        if (activeShipments.length > 0 && !selectedShipment) {
          setSelectedShipment(activeShipments[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch shipments"
        );
        console.error("Error fetching shipments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, [selectedShipment]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_TRANSIT":
        return "bg-blue-500";
      case "DELIVERED":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "IN_TRANSIT":
        return 60;
      case "DELIVERED":
        return 100;
      default:
        return 0;
    }
  };

  const handleSearch = () => {
    if (trackingNumber.trim()) {
      const found = shipments.find(
        (s) =>
          s.shipmentTrackingId?.toLowerCase() ===
            trackingNumber.toLowerCase() ||
          s.code?.toLowerCase() === trackingNumber.toLowerCase()
      );
      if (found) {
        setSelectedShipment(found.id);
      }
    }
  };

  const handleScanQR = () => {
    console.log("Opening QR scanner...");
  };

  // Get currently selected shipment
  const currentShipment = shipments.find((s) => s.id === selectedShipment);

  return (
    <div className="pt-20 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Shipment Tracking</h1>
          <p className="text-muted-foreground">
            Track your orders in real-time across the globe
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="glass border-border/50 p-12 text-center">
            <p className="text-muted-foreground">Loading shipments...</p>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="glass border-border/50 p-6 mb-8 bg-destructive/10">
            <p className="text-destructive">
              <AlertTriangle className="w-4 h-4 mr-2 inline" />
              {error}
            </p>
          </Card>
        )}

        {/* Search Bar */}
        {!loading && (
          <>
            <Card className="glass border-border/50 p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Enter tracking or order number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button variant="hero" onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Track Package
                </Button>
                <Button variant="outline" onClick={handleScanQR}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR
                </Button>
              </div>
            </Card>

            {shipments.length === 0 ? (
              <Card className="glass border-border/50 p-12 text-center">
                <p className="text-muted-foreground">
                  No active shipments found. Check back soon!
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Shipments List */}
                <div className="lg:col-span-1">
                  <Card className="glass border-border/50 p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Active Shipments ({shipments.length})
                    </h3>
                    <div className="space-y-3">
                      {shipments.map((shipment) => (
                        <div
                          key={shipment.id}
                          onClick={() => setSelectedShipment(shipment.id)}
                          className={`p-4 rounded-lg cursor-pointer transition-smooth border ${
                            selectedShipment === shipment.id
                              ? "border-primary bg-primary/10"
                              : "border-border/50 hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {shipment.code || shipment.id.slice(0, 8)}
                            </span>
                            <Badge
                              variant="outline"
                              className={getStatusColor(shipment.status)}
                            >
                              {shipment.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {shipment.items
                              .map((item) => item.product.name)
                              .join(", ")}
                          </p>
                          {shipment.shipmentTrackingId && (
                            <div className="text-xs text-muted-foreground">
                              ID: {shipment.shipmentTrackingId}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Tracking Details */}
                {currentShipment && (
                  <div className="lg:col-span-3">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      {/* Main Tracking Info */}
                      <div className="xl:col-span-2 space-y-6">
                        {/* Shipment Header */}
                        <Card className="glass border-border/50 p-6">
                          <div className="flex items-start justify-between mb-6">
                            <div>
                              <h2 className="text-2xl font-bold mb-1">
                                {currentShipment.code || currentShipment.id}
                              </h2>
                              <p className="text-muted-foreground mb-2">
                                {currentShipment.items
                                  .map((item) => item.product.name)
                                  .join(", ")}
                              </p>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span>
                                  Order from {currentShipment.user.fullName}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(
                                currentShipment.status
                              )} text-white`}
                            >
                              {currentShipment.status.replace("_", " ")}
                            </Badge>
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">
                                Delivery Progress
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {getProgressPercentage(currentShipment.status)}%
                              </span>
                            </div>
                            <Progress
                              value={getProgressPercentage(
                                currentShipment.status
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Order Date
                              </p>
                              <p className="font-semibold">
                                {currentShipment.createdAt
                                  ? new Date(
                                      currentShipment.createdAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Total
                              </p>
                              <p className="font-semibold">
                                $
                                {typeof currentShipment.total === "number"
                                  ? currentShipment.total.toFixed(2)
                                  : "0.00"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Items
                              </p>
                              <p className="font-semibold">
                                {currentShipment.items?.length || 0}
                              </p>
                            </div>
                            {currentShipment.shipmentTrackingId && (
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Tracking ID
                                </p>
                                <p className="font-semibold text-xs">
                                  {currentShipment.shipmentTrackingId}
                                </p>
                              </div>
                            )}
                          </div>
                        </Card>

                        {/* Order Status Info */}
                        <Card className="glass border-border/50 p-6">
                          <h3 className="text-lg font-semibold mb-4">
                            Order Status
                          </h3>
                          <div className="p-4 bg-info/10 rounded-lg flex items-center">
                            {currentShipment.status === "IN_TRANSIT" && (
                              <>
                                <Truck className="w-5 h-5 mr-3 text-blue-500" />
                                <div>
                                  <p className="font-semibold text-sm">
                                    Your order is on its way
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Tracking ID:{" "}
                                    {currentShipment.shipmentTrackingId ||
                                      "Pending"}
                                  </p>
                                </div>
                              </>
                            )}
                            {currentShipment.status === "DELIVERED" && (
                              <>
                                <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                                <div>
                                  <p className="font-semibold text-sm">
                                    Your order has been delivered
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Thank you for your purchase
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </Card>
                      </div>

                      {/* Sidebar */}
                      <div className="space-y-6">
                        {/* Environmental Conditions */}
                        <Card className="glass border-border/50 p-6">
                          <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Thermometer className="w-5 h-5 mr-2" />
                            Live Conditions
                          </h3>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Temperature
                              </span>
                              <span className="font-semibold">24°C</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Humidity
                              </span>
                              <span className="font-semibold">65%</span>
                            </div>
                            <div className="p-3 bg-success/10 rounded-lg">
                              <div className="flex items-center text-success">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">
                                  Optimal Conditions
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="glass border-border/50 p-6">
                          <h3 className="text-lg font-semibold mb-4">
                            Quick Actions
                          </h3>

                          <div className="space-y-3">
                            <Button variant="outline" className="w-full">
                              <Calendar className="w-4 h-4 mr-2" />
                              Schedule Delivery
                            </Button>

                            <Button variant="outline" className="w-full">
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Report Issue
                            </Button>

                            <Button variant="outline" className="w-full">
                              <Globe className="w-4 h-4 mr-2" />
                              View on Map
                            </Button>
                          </div>
                        </Card>

                        {/* Delivery Estimate */}
                        <Card className="glass border-border/50 p-6">
                          <h3 className="text-lg font-semibold mb-4">
                            Delivery Info
                          </h3>

                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Estimated Arrival
                              </p>
                              <p className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
                                Soon
                              </p>
                            </div>

                            <div className="p-3 bg-info/10 rounded-lg">
                              <div className="flex items-center text-info">
                                <Clock className="w-4 h-4 mr-2" />
                                <span className="text-sm">On Schedule</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ShipmentTracking;
