"use client";

import { useEffect, useState } from "react";
import { DialogPortal } from "@radix-ui/react-dialog";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Dialog, DialogContent } from "~~/components/ui/dialog";

interface WalletDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WalletDialog({ open = false, onOpenChange }: WalletDialogProps) {
  const { connectors, connect, status: connectStatus } = useConnect();
  const { address: connectedAddress, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [uiMessage, setUiMessage] = useState<string | null>(null);

  // Filter duplicate WalletConnect and remove Phantom wallet
  const filteredConnectors = connectors.filter((connector, index, self) => {
    // Filter out Phantom wallet
    if (connector.name.toLowerCase().includes("phantom")) {
      return false;
    }

    // For WalletConnect, only keep the first occurrence
    if (connector.name.toLowerCase().includes("walletconnect")) {
      return self.findIndex(c => c.name.toLowerCase().includes("walletconnect")) === index;
    }

    // For MetaMask, only keep the first occurrence
    if (connector.name.toLowerCase().includes("metamask")) {
      return self.findIndex(c => c.name.toLowerCase().includes("metamask")) === index;
    }

    return true;
  });

  const handleDialogClose = () => {
    onOpenChange?.(false);
    setUiMessage(null);
  };

  const handleConnectWallet = async (connectorId: string) => {
    setUiMessage(null);
    console.log("Attempting to connect with:", connectorId);
    try {
      const connector = connectors.find(c => c.id === connectorId);
      if (!connector) throw new Error("Connector not found");
      await connect({ connector });
      onOpenChange?.(false);
    } catch (error: any) {
      console.error("Failed to connect:", error);
      const message = error.shortMessage || error.message || "Failed to connect wallet.";
      setUiMessage(message);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setUiMessage("Wallet disconnected");
  };

  useEffect(() => {
    if (isConnected && open) {
      setUiMessage(`Connected as: ${connectedAddress?.slice(0, 6)}...${connectedAddress?.slice(-4)}`);
    }
    if (!isConnected) {
      setUiMessage(null);
    }
  }, [isConnected, open, connectedAddress, onOpenChange]);

  // Burner wallet functionality removed to fix linting errors
  // Will be implemented in a future version

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogPortal>
        <DialogContent className="max-w-[440px] p-0 gap-0 bg-[#bcbcbc] border-0 rounded-none">
          <div className="m-3 shadow-[2px_2px_4px_rgba(0,0,0,0.05)] bg-[#bcbcbc]">
            <div className="p-4 flex items-center justify-between border-b border-[#E6E6E6]">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif text-black">🗝️ CONNECT WALLET</h2>
              </div>
              <button
                onClick={handleDialogClose}
                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-black/5 disabled:opacity-50 text-black"
              >
                ×
              </button>
            </div>

            {!isConnected && (
              <>
                <div className="p-4 space-y-[6px] bg-[#bcbcbc]">
                  {filteredConnectors.map(connector => (
                    <button
                      key={connector.id}
                      onClick={() => handleConnectWallet(connector.id)}
                      disabled={connectStatus === "pending"}
                      className="w-full h-12 px-4 hover:bg-[#efefef] border border-[#E6E6E6] flex items-center justify-between font-serif bg-[#bcbcbc] text-black disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                    >
                      <span>
                        {connector.name.toUpperCase()}
                        {connectStatus === "pending" && " (connecting...)"}
                      </span>
                      <span className="text-lg">→</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {(isConnected || uiMessage) && (
              <div className="p-6 space-y-4 bg-[#bcbcbc] text-center">
                {uiMessage && <p className="font-serif text-sm text-black font-medium">{uiMessage}</p>}
                {isConnected && !uiMessage && (
                  <p className="font-serif text-sm text-black font-medium">
                    Connected: {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  {isConnected && (
                    <button
                      onClick={handleDisconnect}
                      className="w-full h-10 bg-red-500 hover:bg-red-600 text-white font-serif rounded-none"
                    >
                      DISCONNECT
                    </button>
                  )}
                  <button
                    onClick={handleDialogClose}
                    className="w-full h-10 bg-[#2563EB] hover:bg-blue-700 text-white font-serif rounded-none"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
