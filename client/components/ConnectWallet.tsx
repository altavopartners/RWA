// components/ConnectWallet.tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, Shield, Globe, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ConnectWallet = () => {
  const { connectWallet, isLoading, isConnected } = useAuth();

  if (isConnected) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 glass border-border/50">
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground">
                Connect your Web3 wallet to access Hex-Port and start trading
                African exports
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-success" />
              <span className="text-sm">Secure blockchain authentication</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-success" />
              <span className="text-sm">Access global marketplace</span>
            </div>
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-success" />
              <span className="text-sm">Manage tokenized products</span>
            </div>
          </div>

          {/* Connect Button */}
          <Button
            onClick={connectWallet}
            disabled={isLoading}
            variant="hero"
            size="lg"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ConnectWallet;
