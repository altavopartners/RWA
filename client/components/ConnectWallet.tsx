"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, Shield, Globe, Loader2, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { useEffect } from "react";

const ConnectWallet = () => {
  const { connectWallet, isLoading, isConnected } = useAuth();
  const { showConnectModal, hideConnect } = useWalletConnect();

  useEffect(() => {
    if (isConnected && showConnectModal) {
      hideConnect();
    }
  }, [isConnected, showConnectModal, hideConnect]);

  if (!showConnectModal || isConnected) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="relative w-full max-w-md mx-4 p-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={hideConnect}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#88CEDC] to-[#5BA8B8] mb-4 shadow-lg">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Connect your Web3 wallet to access Hex-Port and start trading African exports
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Secure authentication
            </span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Access global marketplace
            </span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Manage tokenized products
            </span>
          </div>
        </div>

        {/* Connect Button */}
        <Button
          onClick={connectWallet}
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet
            </>
          )}
        </Button>

        {/* Footer Note */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          By connecting, you agree to our Terms of Service
        </p>
      </Card>
    </div>
  );
};

export default ConnectWallet;