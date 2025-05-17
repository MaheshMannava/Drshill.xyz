"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { formatEther } from "viem";
import { WalletDialog } from "./WalletDialog";

const Navbar = () => {
  const { address, isConnected } = useAccount();
  const [tokenBalance, setTokenBalance] = useState<string>("100");
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);

  // Read CROP token balance when connected
  const { data: rawBalance } = useScaffoldReadContract({
    contractName: "CropToken",
    functionName: "balanceOf",
    args: [address as `0x${string}` || undefined],
    query: {
      enabled: !!address,
    },
  });

  useEffect(() => {
    if (rawBalance) {
      // Convert from wei to whole tokens (assuming 18 decimals)
      const formatted = parseFloat(formatEther(rawBalance)).toFixed(0);
      setTokenBalance(formatted);
    }
  }, [rawBalance]);

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-4 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <Link href="/" passHref className="items-center gap-2 ml-4 mr-6 shrink-0 flex">
          <div className="flex flex-col">
            <span className="font-bold leading-tight text-xl">DrShill</span>
          </div>
        </Link>
        <Link href="/debug" passHref className="text-sm px-2">
          Debug Contracts
        </Link>
      </div>
      <div className="navbar-end flex-grow mr-4">
        <div className="flex items-center justify-end gap-4">
          <div className="bg-base-200 rounded-xl py-1.5 px-4">
            <span className="font-bold">CROP: {tokenBalance}</span>
          </div>
          <button
            className="btn btn-primary btn-sm px-4"
            onClick={() => setWalletDialogOpen(true)}
          >
            {isConnected ? 
              `${address?.substring(0, 6)}...${address?.substring(address.length - 4)}` : 
              "Connect Wallet"}
          </button>
          <WalletDialog 
            open={walletDialogOpen} 
            onOpenChange={setWalletDialogOpen} 
          />
        </div>
      </div>
    </div>
  );
};

export default Navbar; 