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
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-sidebar-primary" />
            <div>
              <h2 className="font-semibold text-sidebar-foreground">
                Hex-Port Bank
              </h2>
              <p className="text-xs text-muted-foreground">
                Compliance Dashboard
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-auto p-3",
                    collapsed && "justify-center p-2",
                    isActive &&
                      "bg-sidebar-primary text-sidebar-primary-foreground"
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5", collapsed ? "h-6 w-6" : "")}
                  />
                  {!collapsed && (
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs opacity-70">
                        {item.description}
                      </span>
                    </div>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground">
            <p>Hedera Network</p>
            <p className="text-sidebar-accent">Connected</p>
          </div>
        </div>
      )}
    </div>
  );
}
