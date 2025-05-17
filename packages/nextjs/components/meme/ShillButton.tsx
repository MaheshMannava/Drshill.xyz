import React, { useState } from "react";
// import { parseEther } from "viem"; // Removed as unused
import { useAccount, useWriteContract } from "wagmi";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

interface ShillButtonProps {
  memeSymbol: string;
  // ticketPrice?: bigint; // Default ticket price in CROP tokens // Commented out as unused
}

export const ShillButton: React.FC<ShillButtonProps> = ({
  memeSymbol,
  // ticketPrice = parseEther("1"), // Default 1 CROP token // Commented out as unused
}) => {
  const { isConnected } = useAccount();
  const [isShilling, setIsShilling] = useState(false);

  // Get the deployed CropCircle contract
  const { data: cropCircleContract } = useDeployedContractInfo("CropCircle");

  // Setup the contract write for buying tickets
  // const { writeContract, isPending, isSuccess } = useWriteContract(); // Commented out as unused
  const { isPending, isSuccess } = useWriteContract(); // Keep isPending and isSuccess for UI

  // Watch for success/error events
  React.useEffect(() => {
    if (isSuccess) {
      setIsShilling(false);
    }
  }, [isSuccess]);

  const handleShillClick = async () => {
    if (!isConnected || !cropCircleContract?.address) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      setIsShilling(true);

      // NOTE: This functionality is currently disabled due to type errors
      // The "buyTickets" function doesn't exist in the current contract
      // This will be implemented in a future version
      /*
      writeContract({
        address: cropCircleContract.address,
        abi: cropCircleContract.abi,
        functionName: "buyTickets",
        args: [memeSymbol, 1], // Buy 1 ticket for the meme
        value: ticketPrice, // Set the ticket price
      });
      */

      console.log("Shill button clicked for", memeSymbol);
      // For now, just simulate success after a delay
      setTimeout(() => {
        setIsShilling(false);
      }, 1000);
    } catch (error) {
      console.error("Error buying tickets:", error);
      setIsShilling(false);
    }
  };

  return (
    <button
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!isConnected || isShilling || isPending}
      onClick={handleShillClick}
    >
      {isShilling || isPending ? "Shilling..." : "Shill Now"}
    </button>
  );
};
