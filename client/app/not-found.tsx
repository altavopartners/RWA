// client/app/not-found.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0C171B] dark:via-[#1a2930] dark:to-[#0C171B] relative overflow-hidden flex flex-col">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating clouds */}
        <div className="absolute top-20 left-20 w-32 h-16 bg-gray-300/30 dark:bg-gray-700/30 rounded-full blur-xl animate-float" />
        <div className="absolute top-40 right-32 w-40 h-20 bg-gray-300/30 dark:bg-gray-700/30 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 left-1/4 w-36 h-18 bg-gray-300/30 dark:bg-gray-700/30 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
        
        {/* Stars */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-gray-400 dark:bg-white rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-gray-400 dark:bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-gray-400 dark:bg-white rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-gray-400 dark:bg-white rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Main Content - Takes remaining space */}
      <div className="flex-1 flex items-center justify-center pt-20 pb-12">
        <div className="container mx-auto px-6 relative z-10">
          {/* Main 404 Illustration */}
          <div className={`text-center mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Sign Post Illustration */}
            <div className="relative inline-block mb-6 scale-75 sm:scale-90">
              {/* Wooden post */}
              <div className="relative">
                <div className="w-4 h-64 bg-gradient-to-b from-gray-500 to-gray-600 dark:from-gray-400 dark:to-gray-500 mx-auto rounded-t-lg shadow-2xl" />
                <div className="w-6 h-6 bg-gray-600 dark:bg-gray-500 mx-auto rounded-sm -mt-1" />
                
                {/* Horizontal beam */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 h-12 bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500 dark:from-gray-400 dark:via-gray-300 dark:to-gray-400 rounded-lg shadow-2xl -rotate-2">
                  {/* Wood texture lines */}
                  <div className="absolute inset-0 flex items-center justify-around px-4">
                    <div className="w-px h-8 bg-gray-600/30 dark:bg-gray-500/30" />
                    <div className="w-px h-8 bg-gray-600/30 dark:bg-gray-500/30" />
                    <div className="w-px h-8 bg-gray-600/30 dark:bg-gray-500/30" />
                  </div>
                </div>
                
                {/* 404 Sign */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gradient-to-br from-[#FDB44B] to-[#F59E0B] px-12 py-6 rounded-2xl shadow-2xl border-4 border-[#D97706] animate-float-sign">
                  <div className="text-6xl font-bold text-white drop-shadow-lg">404</div>
                  <div className="text-2xl font-bold text-white/90 italic drop-shadow">ERROR!</div>
                </div>
                
                {/* Rope/chains */}
                <div className="absolute top-4 left-1/2 -translate-x-20 w-1 h-16 bg-gray-700 dark:bg-gray-600 shadow-lg" />
                <div className="absolute top-4 left-1/2 translate-x-20 w-1 h-16 bg-gray-700 dark:bg-gray-600 shadow-lg" />
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className={`text-center max-w-2xl mx-auto transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Lost? Let&apos;s Help You Find Your Way
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Looks like you&apos;ve hit a dead end — but don&apos;t worry, we&apos;ll help you get back on track
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white font-semibold px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.back()}
                className="border-2 border-[#88CEDC] text-[#88CEDC] hover:bg-[#88CEDC] hover:text-white font-semibold px-8 py-6 text-lg transition-all hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/marketplace')}
                className="border-2 border-gray-400 dark:border-white/30 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 hover:border-gray-500 dark:hover:border-white/50 font-semibold px-8 py-6 text-lg transition-all hover:scale-105"
              >
                <Search className="w-5 h-5 mr-2" />
                Marketplace
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer at the very bottom */}
      <Footer />

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(-10px) translateX(-10px); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}