// client/app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Shield, Globe, Truck, FileCheck, Wallet } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { isConnected } = useAuth();

  const features = [
    {
      icon: Wallet,
      title: "Connect Wallet",
      description: "Seamlessly connect your Web3 wallet using WalletConnect",
    },
    {
      icon: Coins,
      title: "Tokenize Products",
      description:
        "Transform African exports into HTS tokens on Hedera network",
    },
    {
      icon: FileCheck,
      title: "Upload Certificates",
      description: "Store product certificates securely on IPFS",
    },
    {
      icon: Globe,
      title: "Global Marketplace",
      description: "List tokenized products for international buyers",
    },
    {
      icon: Shield,
      title: "Secure Escrow",
      description: "Smart contract escrow protects both buyers and sellers",
    },
    {
      icon: Truck,
      title: "Track Shipments",
      description: "Real-time delivery tracking with blockchain verification",
    },
  ];

  return (
    <>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background from /public */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(/assets/export.jpg)` }}
          />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
          <div className="absolute inset-0 pattern-grid opacity-30" />

          {/* Content */}
          <div className="relative z-10 container mx-auto px-6 text-center">
            <Badge variant="outline" className="mb-6 glass animate-fade-in">
              🌍 Powered by Hedera Network
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              <span className="gradient-sunset bg-clip-text text-transparent">
                Hex-Port
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in">
              The first Web3 platform enabling African producers to tokenize
              exports, connect with global buyers, and secure transactions
              through blockchain escrow.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              <Button
                variant="default"
                size="lg"
                className="animate-float"
                onClick={() => router.push("/producer-dashboard")}
              >
                <Wallet className="w-5 h-5" />
                Start as Producer
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={() => router.push("/marketplace")}
              >
                Explore Marketplace
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold ">500+</div>
                <div className="text-sm text-muted-foreground">
                  Products Listed
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold ">50+</div>
                <div className="text-sm text-muted-foreground">
                  Verified Producers
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold ">$2M+</div>
                <div className="text-sm text-muted-foreground">
                  Volume Traded
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 relative">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                How <span className=" ">Hex-Port</span> Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Bridging traditional African exports with cutting-edge Web3
                technology
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="p-8 glass border-border/50 hover:border-primary/50 transition-smooth group hover:shadow-card animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mr-4 group-hover:animate-glow-pulse">
                      <feature.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative">
          <div className="absolute inset-0 gradient-earth opacity-50" />
          <div className="relative z-10 container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Export to the World?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join African producers who are already leveraging Web3 technology
              to reach global markets
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="default"
                size="lg"
                onClick={() => router.push("/producer-dashboard")}
              >
                Start as Producer
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={() => router.push("/marketplace")}
              >
                Browse as Buyer
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-border/50">
          <div className="container mx-auto px-6 text-center">
            <div className="mb-4">
              <span className="text-2xl font-bold  ">Hex-Port</span>
            </div>
            <p className="text-muted-foreground">
              Empowering African exports through Web3 technology
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
