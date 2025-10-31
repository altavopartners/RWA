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
      title: "Instant Wallet Connect",
      description: "Link your Web3 wallet effortlessly and start trading in seconds.",
    },
    {
      icon: Coins,
      title: "Tokenize Your Products",
      description: "Convert your exports into secure HTS tokens for global trade.",
    },
    {
      icon: FileCheck,
      title: "Verified Certificates",
      description: "Store and share product certifications on IPFS, trusted worldwide.",
    },
    {
      icon: Globe,
      title: "Reach Global Buyers",
      description: "List your tokenized products for international visibility and demand.",
    },
    {
      icon: Shield,
      title: "Smart Escrow Security",
      description: "Protect your transactions with blockchain-backed escrow contracts.",
    },
    {
      icon: Truck,
      title: "Track Every Shipment",
      description: "Monitor deliveries in real-time, ensuring transparency and trust.",
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <div className="pt-16 min-h-screen bg-gradient-to-br from-[#486C7A] via-[#265663] to-[#0C171B] -mt-16">
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Globe Image */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-90 hidden lg:block">
            <img 
              src="/assets/globe.png" 
              alt="Global Trade" 
              className="w-full h-full object-cover object-left"
              style={{ maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)', WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)' }}
            />
          </div>

          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#88CEDC] rounded-full blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative z-10 container mx-auto px-6 pt-32">
            <div className="max-w-3xl">
              <h1 className="text-6xl md:text-8xl font-bold mb-6 text-white animate-fade-in leading-tight" style={{ color: '#edf6f9' }}>
                Hex-Port
              </h1>

              <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl animate-fade-in leading-relaxed">
                The first Web3 platform enabling African producers to tokenize
                exports, connect with global buyers, and secure transactions
                through Hedera escrow.
              </p>

              <p className="text-white/90 text-lg mb-4 font-medium animate-fade-in">
                Unlock Africa&apos;s Export Potential
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-fade-in">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-white/90 font-semibold px-8 py-6 text-lg rounded-full"
                  onClick={() => router.push("/producer-add-product")}
                >
                  Become a Producer
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white border-2 border-white/30 hover:bg-white/10 hover:border-white/50 font-semibold px-8 py-6 text-lg rounded-full backdrop-blur-sm"
                  onClick={() => router.push("/marketplace")}
                >
                  Explore Products
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Features Section */}
      <section className="py-24 relative bg-white dark:bg-gray-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-[#88CEDC] border-[#88CEDC]/30">
              Platform Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              How <span className="text-[#88CEDC]">Hex-Port</span> Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Bridging traditional African exports with cutting-edge Web3 technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-[#88CEDC] dark:hover:border-[#88CEDC] transition-all duration-300 group hover:shadow-xl animate-slide-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#88CEDC] to-[#5BA8B8] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-4xl font-bold text-[#88CEDC] mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-400">Products Listed</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-4xl font-bold text-[#88CEDC] mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-400">Verified Producers</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-4xl font-bold text-[#88CEDC] mb-2">2M+ HBAR</div>
              <div className="text-gray-600 dark:text-gray-400">Volume Traded</div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section id="video-demo" className="py-24 relative bg-white dark:bg-gray-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-[#88CEDC] border-[#88CEDC]/30">
              See It In Action
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Watch How <span className="text-[#88CEDC]">Hex-Port</span> Transforms Trade
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover how African producers are using Web3 to reach global markets
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900 aspect-video">
              {/* Video Player */}
              <video 
                className="w-full h-full object-cover"
                controls
                poster="/assets/video-thumbnail.jpg"
              >
                <source src="/assets/hex-port-demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Optional: Custom Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            </div>

            {/* Video Stats/Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-3xl font-bold text-[#88CEDC] mb-2">3 Min</div>
                <div className="text-gray-600 dark:text-gray-400">Quick Platform Tour</div>
              </div>
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-3xl font-bold text-[#88CEDC] mb-2">5 Steps</div>
                <div className="text-gray-600 dark:text-gray-400">From Product to Sale</div>
              </div>
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-3xl font-bold text-[#88CEDC] mb-2">100%</div>
                <div className="text-gray-600 dark:text-gray-400">Secure Transactions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative bg-gradient-to-br from-[#88CEDC] to-[#5098A9]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#B8E5EC] rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white" style={{ color: '#edf6f9' }}>
            Ready to Take Your Products Global?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of African producers already leveraging Web3 to reach buyers worldwide, increase sales, and secure every transaction.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-gray-900 hover:bg-white/90 font-semibold px-8 py-6 text-lg rounded-full"
              onClick={() => router.push("/producer-add-product")}
            >
              Start Selling Today
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-white border-2 border-white/30 hover:bg-white/10 hover:border-white/50 font-semibold px-8 py-6 text-lg rounded-full backdrop-blur-sm"
              onClick={() => router.push("/marketplace")}
            >
              Browse Products
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 dark:bg-black border-t border-gray-800">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-4">
            <span className="text-2xl font-bold text-white">Hex-Port</span>
          </div>
          <p className="text-gray-400">
            Empowering African exports through Web3 technology
          </p>
        </div>
      </footer>
    </>
  );
}