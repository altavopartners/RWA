"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  FileText,
  Shield,
  Scale,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";

const navigation = [
  {
    name: "Orders",
    href: "/bank",
    icon: ShoppingCart,
    description: "Active trade orders and approvals",
  },
  {
    name: "Clients",
    href: "/bank/clients",
    icon: Users,
    description: "KYC validation and client management",
  },
  {
    name: "Documents",
    href: "/bank/documents",
    icon: FileText,
    description: "Document verification queue",
  },
  {
    name: "Escrows",
    href: "/bank/escrows",
    icon: Shield,
    description: "Multisig escrow approvals",
  },
  {
    name: "Disputes",
    href: "/bank/disputes",
    icon: Scale,
    description: "Arbitration and dispute resolution",
  },
];

export function BankSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 transition-all duration-300 relative",
        collapsed ? "w-20" : "w-80"
      )}
    >
      {/* Gradient background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#88CEDC]/5 via-transparent to-[#5BA8B8]/5 pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-800/50">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-lg blur-md opacity-50" />
              <div className="relative bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] p-2 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">
                Hex-Port Bank
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Compliance Dashboard
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-lg blur-md opacity-50" />
              <div className="relative bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] p-2 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "h-8 w-8 p-0 hover:bg-[#88CEDC]/10 transition-colors",
            collapsed && "absolute -right-3 top-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg rounded-full z-10"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-[#5BA8B8]" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4 relative">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className="relative group">
                  {/* Glow effect on hover */}
                  {isActive && (
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-xl opacity-20 blur-md" />
                  )}
                  
                  <Button
                    variant="ghost"
                    className={cn(
                      "relative w-full justify-start gap-3 h-auto p-3 transition-all duration-300 rounded-xl",
                      collapsed && "justify-center p-2",
                      isActive
                        ? "bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] text-white shadow-lg shadow-[#88CEDC]/30 hover:from-[#7BC0CF] hover:to-[#4A97A7]"
                        : "hover:bg-gray-100/80 dark:hover:bg-gray-800/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 hover:scale-105 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-all",
                        collapsed ? "h-6 w-6" : "",
                        isActive ? "text-white drop-shadow-lg" : "text-[#5BA8B8]"
                      )}
                    />
                    {!collapsed && (
                      <div className="flex flex-col items-start">
                        <span className={cn(
                          "font-semibold text-sm",
                          isActive ? "text-white" : "text-gray-900 dark:text-white"
                        )}>
                          {item.name}
                        </span>
                        <span className={cn(
                          "text-xs leading-tight",
                          isActive ? "text-white/90" : "text-gray-500 dark:text-gray-400"
                        )}>
                          {item.description}
                        </span>
                      </div>
                    )}
                  </Button>
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}