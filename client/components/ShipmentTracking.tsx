import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  MapPin,
  Truck,
  Package,
  Plane,
  Ship,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Globe,
  Thermometer,
  Shield,
  QrCode,
} from "lucide-react";

const ShipmentTracking = () => {
  const [trackingNumber, setTrackingNumber] = useState("HEX123456789");
  const [selectedShipment, setSelectedShipment] = useState("1");

  const mockShipments = [
    {
      id: "1",
      trackingNumber: "HEX123456789",
      orderId: "ORD-2024-001",
      productName: "Premium Ghanaian Cocoa Beans",
      origin: "Kumasi, Ghana",
      destination: "Hamburg, Germany",
      status: "in_transit",
      progress: 65,
      estimatedDelivery: "2024-02-15",
      carrier: "Ghana Shipping Line",
      currentLocation: "Port of Tema, Ghana",
      weight: "500 kg",
      temperature: "24°C",
      humidity: "65%",
      events: [
        {
          id: "1",
          status: "picked_up",
          location: "Ashanti Organic Farms, Kumasi",
          timestamp: "2024-01-22 08:00",
          description: "Package picked up from producer",
          icon: Package,
          completed: true,
        },
        {
          id: "2",
          status: "warehouse",
          location: "Export Processing Zone, Tema",
          timestamp: "2024-01-23 14:30",
          description: "Arrived at export warehouse for inspection",
          icon: Shield,
          completed: true,
        },
        {
          id: "3",
          status: "customs",
          location: "Ghana Customs, Port of Tema",
          timestamp: "2024-01-24 09:15",
          description: "Customs clearance completed",
          icon: CheckCircle,
          completed: true,
        },
        {
          id: "4",
          status: "departed",
          location: "Port of Tema, Ghana",
          timestamp: "2024-01-25 16:00",
          description: "Departed from origin port",
          icon: Ship,
          completed: true,
        },
        {
          id: "5",
          status: "in_transit",
          location: "Atlantic Ocean",
          timestamp: "2024-01-28 12:00",
          description: "In transit via ocean freight",
          icon: Truck,
          completed: false,
          current: true,
        },
        {
          id: "6",
          status: "arrived",
          location: "Port of Hamburg, Germany",
          timestamp: null,
          description: "Arrived at destination port",
          icon: MapPin,
          completed: false,
        },
        {
          id: "7",
          status: "delivered",
          location: "Final Destination",
          timestamp: null,
          description: "Package delivered to buyer",
          icon: CheckCircle,
          completed: false,
        },
      ],
    },
    {
      id: "2",
      trackingNumber: "HEX987654321",
      orderId: "ORD-2024-002",
      productName: "Authentic Kente Cloth",
      origin: "Kumasi, Ghana",
      destination: "New York, USA",
      status: "pending",
      progress: 15,
      estimatedDelivery: "2024-02-20",
      carrier: "DHL Express",
      currentLocation: "Adoma Textiles Workshop",
      weight: "2.5 kg",
      temperature: "22°C",
      humidity: "58%",
      events: [
        {
          id: "1",
          status: "preparing",
          location: "Adoma Textiles, Kumasi",
          timestamp: "2024-01-20 10:00",
          description: "Order confirmed, weaving in progress",
          icon: Package,
          completed: true,
        },
        {
          id: "2",
          status: "quality_check",
          location: "Adoma Textiles, Kumasi",
          timestamp: null,
          description: "Quality inspection pending",
          icon: Shield,
          completed: false,
          current: true,
        },
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning";
      case "in_transit":
        return "bg-info";
      case "delivered":
        return "bg-success";
      case "delayed":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const currentShipment = mockShipments.find((s) => s.id === selectedShipment)!;

  const handleSearch = () => {
    console.log("Searching for tracking number:", trackingNumber);
  };

  const handleScanQR = () => {
    console.log("Opening QR scanner...");
  };

  return (
    <div className="pt-20 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Shipment Tracking</h1>
          <p className="text-muted-foreground">
            Track your products in real-time across the globe
          </p>
        </div>

        {/* Search Bar */}
        <Card className="glass border-border/50 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Enter tracking number (e.g., HEX123456789)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Shipments List */}
          <div className="lg:col-span-1">
            <Card className="glass border-border/50 p-6">
              <h3 className="text-lg font-semibold mb-4">Active Shipments</h3>
              <div className="space-y-3">
                {mockShipments.map((shipment) => (
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
                        {shipment.trackingNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className={getStatusColor(shipment.status)}
                      >
                        {shipment.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                      {shipment.productName}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>
                          {shipment.origin} → {shipment.destination}
                        </span>
                      </div>
                      <Progress value={shipment.progress} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Tracking Details */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Main Tracking Info */}
              <div className="xl:col-span-2 space-y-6">
                {/* Shipment Header */}
                <Card className="glass border-border/50 p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">
                        {currentShipment.trackingNumber}
                      </h2>
                      <p className="text-muted-foreground mb-2">
                        {currentShipment.productName}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>
                          {currentShipment.origin} →{" "}
                          {currentShipment.destination}
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
                        {currentShipment.progress}%
                      </span>
                    </div>
                    <Progress value={currentShipment.progress} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Carrier</p>
                      <p className="font-semibold">{currentShipment.carrier}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="font-semibold">{currentShipment.weight}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Est. Delivery
                      </p>
                      <p className="font-semibold">
                        {currentShipment.estimatedDelivery}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Current Location
                      </p>
                      <p className="font-semibold line-clamp-1">
                        {currentShipment.currentLocation}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Tracking Events */}
                <Card className="glass border-border/50 p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Tracking History
                  </h3>

                  <div className="space-y-4">
                    {currentShipment.events.map((event, index) => {
                      const EventIcon = event.icon;
                      return (
                        <div key={event.id} className="flex items-start gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              event.completed
                                ? "bg-success/20"
                                : event.current
                                ? "bg-warning/20 animate-pulse"
                                : "bg-muted/20"
                            }`}
                          >
                            <EventIcon
                              className={`w-5 h-5 ${
                                event.completed
                                  ? "text-success"
                                  : event.current
                                  ? "text-warning"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4
                                className={`font-medium ${
                                  event.completed || event.current
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {event.description}
                              </h4>
                              {event.timestamp && (
                                <span className="text-sm text-muted-foreground">
                                  {event.timestamp}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </p>
                          </div>
                        </div>
                      );
                    })}
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
                      <span className="font-semibold">
                        {currentShipment.temperature}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Humidity
                      </span>
                      <span className="font-semibold">
                        {currentShipment.humidity}
                      </span>
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
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>

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
                  <h3 className="text-lg font-semibold mb-4">Delivery Info</h3>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Estimated Arrival
                      </p>
                      <p className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
                        {currentShipment.estimatedDelivery}
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
        </div>
      </div>
    </div>
  );
};

export default ShipmentTracking;
