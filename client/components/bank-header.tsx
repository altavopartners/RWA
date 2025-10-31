"use client";
import { Bell, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBankAuth } from "@/hooks/useBankAuth";

interface BankHeaderProps {
  title: string;
  description?: string;
}

export function BankHeader({ title, description }: BankHeaderProps) {
  const { logout } = useBankAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="relative flex items-center justify-between px-8 py-6">
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#88CEDC]/5 via-transparent to-[#5BA8B8]/5 pointer-events-none" />

      <div className="relative">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#5BA8B8] to-[#88CEDC] bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {description}
          </p>
        )}
      </div>

      <div className="relative flex items-center gap-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative h-11 w-11 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 backdrop-blur-xl transition-all duration-300 hover:scale-105 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
            >
              <Bell className="h-5 w-5 text-[#5BA8B8]" />
              <Badge
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white border-2 border-white dark:border-gray-900 shadow-lg"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-2xl"
          >
            <DropdownMenuLabel className="text-base font-bold text-gray-900 dark:text-white">
              Notifications
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-800/50" />
            <DropdownMenuItem className="p-4 rounded-xl hover:bg-gradient-to-r hover:from-[#88CEDC]/10 hover:to-[#5BA8B8]/10 cursor-pointer transition-all">
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-gray-900 dark:text-white">KYC Approval Required</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Client ABC Corp needs verification
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-4 rounded-xl hover:bg-gradient-to-r hover:from-[#88CEDC]/10 hover:to-[#5BA8B8]/10 cursor-pointer transition-all">
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-gray-900 dark:text-white">Document Validation</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  2 documents pending review
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-4 rounded-xl hover:bg-gradient-to-r hover:from-[#88CEDC]/10 hover:to-[#5BA8B8]/10 cursor-pointer transition-all">
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-gray-900 dark:text-white">Escrow Approval</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Multisig signature required
                </p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-3 px-4 py-3 h-auto rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 backdrop-blur-xl transition-all duration-300 hover:scale-105 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] rounded-full blur-md opacity-50" />
                <Avatar className="relative h-10 w-10 ring-2 ring-white dark:ring-gray-900 shadow-lg">
                  <AvatarImage src="/professional-banker.jpg" />
                  <AvatarFallback className="bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] text-white font-bold">
                    CO
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Compliance Officer</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Bank ID: BNK001</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end"
            className="w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-2xl"
          >
            <DropdownMenuLabel className="text-base font-bold text-gray-900 dark:text-white">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-800/50" />
            <DropdownMenuItem className="p-3 rounded-xl hover:bg-gradient-to-r hover:from-[#88CEDC]/10 hover:to-[#5BA8B8]/10 cursor-pointer transition-all">
              <User className="mr-3 h-5 w-5 text-[#5BA8B8]" />
              <span className="font-medium text-gray-900 dark:text-white">Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-3 rounded-xl hover:bg-gradient-to-r hover:from-[#88CEDC]/10 hover:to-[#5BA8B8]/10 cursor-pointer transition-all">
              <Settings className="mr-3 h-5 w-5 text-[#5BA8B8]" />
              <span className="font-medium text-gray-900 dark:text-white">Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-800/50" />
            <DropdownMenuItem
              className="p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-all text-red-600 dark:text-red-400 font-medium"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}