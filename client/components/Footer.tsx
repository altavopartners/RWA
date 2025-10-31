"use client";

import { Globe } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if URL has #video-demo hash on mount
    if (window.location.hash === "#video-demo") {
      setTimeout(() => {
        const element = document.getElementById("video-demo");
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [pathname]);

  const handleHowItWorksClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If we're already on homepage
    if (pathname === "/") {
      const element = document.getElementById("video-demo");
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Navigate to homepage with hash, useEffect will handle scroll
      router.push("/#video-demo");
    }
  };

  return (
    <footer className="py-16 border-t border-gray-200 dark:border-gray-800 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          {/* Brand Column */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Hex-Port
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Connecting African excellence to the world through Web3 technology and blockchain innovation.
            </p>
            <div className="flex gap-4">
              <a href="https://x.com/hex__port25" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#88CEDC]/10 flex items-center justify-center hover:bg-[#88CEDC]/20 transition-colors">
                <span className="text-[#88CEDC] text-xl">𝕏</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#88CEDC]/10 flex items-center justify-center hover:bg-[#88CEDC]/20 transition-colors">
                <span className="text-[#88CEDC] text-xl">in</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#88CEDC]/10 flex items-center justify-center hover:bg-[#88CEDC]/20 transition-colors">
                <Globe className="w-5 h-5 text-[#88CEDC]" />
              </a>
            </div>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Platform
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="/marketplace" className="text-gray-600 dark:text-gray-400 hover:text-[#88CEDC] dark:hover:text-[#88CEDC] transition-colors">
                  Marketplace
                </a>
              </li>
              <li>
                <a href="/producer-add-product" className="text-gray-600 dark:text-gray-400 hover:text-[#88CEDC] dark:hover:text-[#88CEDC] transition-colors">
                  Become a Producer
                </a>
              </li>
              <li>
                <a 
                  href="/#video-demo" 
                  onClick={handleHowItWorksClick}
                  className="text-gray-600 dark:text-gray-400 hover:text-[#88CEDC] dark:hover:text-[#88CEDC] transition-colors cursor-pointer"
                >
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#88CEDC] dark:hover:text-[#88CEDC] transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#88CEDC] dark:hover:text-[#88CEDC] transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#88CEDC] dark:hover:text-[#88CEDC] transition-colors">
                  Partners
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2025 Hex-Port. All rights reserved. Powered by Hedera.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#88CEDC] dark:hover:text-[#88CEDC] transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#88CEDC] dark:hover:text-[#88CEDC] transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#88CEDC] dark:hover:text-[#88CEDC] transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}