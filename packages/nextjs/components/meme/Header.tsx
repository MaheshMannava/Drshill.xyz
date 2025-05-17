"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { PlusCircle, Ticket, Key, Gift } from "lucide-react";
import { WalletDialog } from "~~/components/WalletDialog";
import { CreateEventDialog } from "./CreateEventDialog";
import { useScaffoldReadContract, useScaffoldWriteContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { getPublicClient, getWalletClient, writeContract } from "wagmi/actions";
import { parseAbi } from "viem";
import { ethers } from "ethers";

// Define interface for event details based on contract struct
interface EventDetails {
  startTime: number;
  endTime: number;
  qrCodeHash: string;
  active: boolean;
  memeCount: number;
  winningTokenAddress: string;
  winningMemeId: number;
  isFinalized: boolean;
}

// Helper to validate event ID format
const isValidEventIdFormat = (id: string | null | undefined): id is `0x${string}` => {
  if (typeof id !== 'string') return false;
  const trimmedId = id.trim();
  // Check for '0x' prefix, 66 characters total (0x + 64 hex), and valid hex characters.
  return trimmedId.startsWith('0x') && trimmedId.length === 66 && /^[0-9a-fA-F]+$/.test(trimmedId.substring(2));
};

export const Header: React.FC = () => {
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const searchParams = useSearchParams();
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [isClaimingTokens, setIsClaimingTokens] = useState(false);

  useEffect(() => {
    const eventIdFromURL = searchParams?.get('id');
    const storedEventId = localStorage.getItem('currentEventId');
    let newEventIdToSet: `0x${string}` | null = null;

    if (eventIdFromURL) {
      const trimmedEventIdFromURL = eventIdFromURL.trim();
      if (isValidEventIdFormat(trimmedEventIdFromURL)) {
        newEventIdToSet = trimmedEventIdFromURL;
      } else {
        console.warn("Invalid event ID format in URL, ignoring:", eventIdFromURL);
      }
    }
    
    if (!newEventIdToSet && storedEventId) {
      const trimmedStoredEventId = storedEventId.trim();
      if (isValidEventIdFormat(trimmedStoredEventId)) {
        newEventIdToSet = trimmedStoredEventId;
      } else {
        console.warn("Invalid event ID format in localStorage, ignoring:", storedEventId);
      }
    }

    if (newEventIdToSet && currentEventId !== newEventIdToSet) {
      setCurrentEventId(newEventIdToSet);
      localStorage.setItem('currentEventId', newEventIdToSet);
    } else if (!newEventIdToSet && currentEventId !== null) {
      setCurrentEventId(null); // Clear if no valid ID is found
    }
  }, [searchParams, currentEventId]);

  const { data: ownerAddress } = useScaffoldReadContract({
    contractName: "CropCircle",
    functionName: "owner",
  });

  const isOwner = Boolean(
    isConnected && address && ownerAddress && address.toLowerCase() === String(ownerAddress).toLowerCase()
  );

  // This will be re-evaluated based on user's request - userTotalTokenBalance not used for display now
  // const { data: userTotalTokenBalance } = useScaffoldReadContract({
  //   contractName: "CropToken",
  //   functionName: "balanceOf",
  //   args: address ? [address] as const : undefined,
  //   watch: true,
  // });

  // Ensure bytes32EventId is correctly typed or undefined
  const bytes32EventId: `0x${string}` | undefined = 
    currentEventId && isValidEventIdFormat(currentEventId) 
      ? currentEventId 
      : undefined;

  const { data: rawEventDetails, isLoading: isLoadingEventDetails } = useScaffoldReadContract({
    contractName: "CropCircle",
    functionName: "getEventDetails",
    args: [bytes32EventId ?? undefined] as const,
    watch: true,
  });

  const parseEventDetails = (): EventDetails | null => {
    if (isLoadingEventDetails || !rawEventDetails || !Array.isArray(rawEventDetails) || rawEventDetails.length < 8) return null;
    if (Number(rawEventDetails[0] || 0) === 0 && bytes32EventId) {
      console.warn(`Event details for ID ${bytes32EventId} appear to be zeroed. Event might not exist.`);
      return null;
    }
    try {
      return {
        startTime: Number(rawEventDetails[0] || 0),
        endTime: Number(rawEventDetails[1] || 0),
        qrCodeHash: String(rawEventDetails[2] || ''),
        active: Boolean(rawEventDetails[3]),
        memeCount: Number(rawEventDetails[4] || 0),
        winningTokenAddress: String(rawEventDetails[5] || ''),
        winningMemeId: Number(rawEventDetails[6] || 0),
        isFinalized: Boolean(rawEventDetails[7])
      };
    } catch (error) {
      console.error("Error parsing event details:", error, rawEventDetails);
      return null;
    }
  };
  const eventDetails = parseEventDetails();

  const { data: hasClaimedData, isLoading: isLoadingHasClaimed } = useScaffoldReadContract({
    contractName: "CropCircle",
    functionName: "hasUserClaimedTokens" as any, 
    args: [bytes32EventId ?? undefined, address as (`0x${string}` | undefined) ?? undefined] as any,
    watch: true,
  });

  const userHasClaimed = Boolean(hasClaimedData);

  const { data: initialTokenAmountData } = useScaffoldReadContract({
    contractName: "CropCircle", 
    functionName: "INITIAL_TOKEN_AMOUNT",
    args: undefined, // Assuming INITIAL_TOKEN_AMOUNT is a public variable with no args
    watch: true, 
  });

  const eventTokensClaimedAmount = initialTokenAmountData 
    ? Number(initialTokenAmountData.toString()) 
    : 100; // Fallback if INITIAL_TOKEN_AMOUNT is not found/readable or is zero

  const displayTokenBalance = eventDetails && eventDetails.active && userHasClaimed 
    ? eventTokensClaimedAmount 
    : 0;

  const { writeContractAsync: provideInitialTokens, isPending: isClaimWritePending } = useScaffoldWriteContract("CropCircle");
  const { writeContractAsync: refillTokensFunction, isPending: isRefillPending } = useScaffoldWriteContract("CropCircle");
  const { writeContractAsync: approveTokensFunction, isPending: isApproving } = useScaffoldWriteContract("CropToken");

  // Add a user token balance check
  const { data: userTokenBalance } = useScaffoldReadContract({
    contractName: "CropToken",
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    watch: true,
  });

  // Get the CropCircle contract address for approval
  const { data: cropCircleContractData } = useDeployedContractInfo({
    contractName: "CropCircle",
  });

  // Get the CropToken contract data for direct contract calls
  const { data: cropTokenContractData } = useDeployedContractInfo({
    contractName: "CropToken",
  });

  // Extract contract address correctly
  const cropCircleAddress = cropCircleContractData?.address;
  const cropTokenAddress = cropTokenContractData?.address;

  const userTokenBalanceNumber = userTokenBalance ? Number(userTokenBalance.toString()) / 10**18 : 0;

  const handleConnectClick = () => {
    if (isConnected) disconnect();
    else setShowWalletDialog(true);
  };

  const eventExists = Boolean(eventDetails && eventDetails.startTime > 0);
  
  // Modified logic to be more lenient for newly created events
  const isEventCurrentlyClaimable = Boolean(
    // If we have event details at all and it's marked as active, consider it claimable
    // This is more lenient than checking timestamps which might be misconfigured
    eventDetails && eventDetails.active
  );

  // Determine whether we're on the event page or main page
  const isEventPage = Boolean(searchParams?.get('id'));

  // Add for debugging - will show in console when conditions change
  useEffect(() => {
    console.log("Event debug info:", {
      eventExists,
      isEventCurrentlyClaimable,
      hasEvent: !!eventDetails,
      active: eventDetails?.active,
      startTime: eventDetails?.startTime,
      currentTime: Math.floor(Date.now() / 1000),
      endTime: eventDetails?.endTime,
      userHasClaimed,
      isLoadingEventDetails,
      isLoadingHasClaimed
    });
  }, [eventDetails, eventExists, isEventCurrentlyClaimable, userHasClaimed, isLoadingEventDetails, isLoadingHasClaimed]);

  // Add a contract balance check
  const { data: contractTokenBalance } = useScaffoldReadContract({
    contractName: "CropCircle",
    functionName: "getContractTokenBalance",
    watch: true,
  });

  // Convert to BigInt for precise comparison - both values should be in wei format with 18 decimals
  const contractBalanceBigInt = contractTokenBalance ? BigInt(contractTokenBalance.toString()) : BigInt(0);
  const requiredTokensBigInt = BigInt(eventTokensClaimedAmount);
  
  // FIXED: Compare BigInt values to avoid decimal precision issues
  const hasEnoughTokens = contractBalanceBigInt >= requiredTokensBigInt;
  
  // Keep number format for display calculations
  const contractBalanceNumber = Number(contractBalanceBigInt.toString());

  // Format the balances for display
  const formattedContractBalance = contractBalanceNumber ? (contractBalanceNumber / 10**18).toFixed(2) : "0";
  const requiredTokens = (eventTokensClaimedAmount / 10**18).toFixed(2);

  const handleClaimTokens = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    // Check if we have an event ID
    if (!currentEventId) {
      alert("No event ID found. Please make sure you're on an event page.");
      return;
    }
    
    // Add extensive debugging information
    console.log("============ CLAIM DEBUG INFO ============");
    console.log("Event ID:", currentEventId);
    console.log("User address:", address);
    console.log("Event exists:", eventExists);
    console.log("Event details:", eventDetails);
    console.log("User claimed:", userHasClaimed);
    console.log("Contract balance (raw):", contractBalanceNumber);
    console.log("Contract balance (formatted):", formattedContractBalance, "CROP");
    console.log("Required tokens (raw):", eventTokensClaimedAmount);
    console.log("Required tokens (formatted):", requiredTokens, "CROP");
    console.log("Has enough tokens:", hasEnoughTokens);
    
    // Additional safety checks
    if (userHasClaimed) {
      alert("Our records show you've already claimed tokens for this event. If you think this is incorrect, please contact the event organizer.");
      return;
    }

    // Check if the contract has enough tokens
    if (!hasEnoughTokens) {
      // Debug the comparison to understand why it's failing
      console.log("DEBUG CONTRACT BALANCE COMPARISON:");
      console.log("Contract balance raw:", contractBalanceNumber);
      console.log("Required amount raw:", eventTokensClaimedAmount);
      console.log("Comparison result:", contractBalanceNumber >= eventTokensClaimedAmount);
      console.log("Decimal comparison:", (contractBalanceNumber/10**18) >= (eventTokensClaimedAmount/10**18));
      
      // Try another approach - directly compare the formatted values
      const isEnoughInHumanReadable = parseFloat(formattedContractBalance) >= parseFloat(requiredTokens);
      console.log("Human readable comparison:", isEnoughInHumanReadable);
      
      // If we have enough according to human readable but not the raw check, use that instead
      if (isEnoughInHumanReadable) {
        console.log("Contract appears to have enough tokens based on decimal comparison, continuing...");
      } else {
        alert(`The contract doesn't have enough tokens to complete this claim. Contract has ${formattedContractBalance} CROP but needs ${requiredTokens} CROP. Please notify the event owner to refill the contract.`);
        return;
      }
    }

    // We'll provide the event ID directly without any modifications
    const rawEventId = currentEventId;
    console.log("Using raw event ID for claim:", rawEventId);
    
    setIsClaimingTokens(true);
    try {
      // Attempt the claim with minimal transformation of the input
      const tx = await provideInitialTokens({
        functionName: "provideInitialTokens",
        args: [rawEventId as any],
      });
      
      console.log("Claim transaction hash:", tx);
      alert("CROP tokens claimed successfully! Transaction: " + tx);
      
    } catch (error) {
      console.error("DETAILED ERROR:", error);
      console.error(JSON.stringify(error, null, 2));
      
      // Extract as much info as possible
      let errorMsg = "Failed to claim tokens: ";
      
      if (error instanceof Error) {
        // Check for common error messages in different parts of the error object
        const fullErrorString = JSON.stringify(error).toLowerCase();
        
        if (fullErrorString.includes("already claimed")) {
          errorMsg = "You have already claimed tokens for this event.";
        } else if (fullErrorString.includes("insufficient") || fullErrorString.includes("balance")) {
          errorMsg = `The contract doesn't have enough tokens. Contract has ${formattedContractBalance} CROP but needs ${requiredTokens} CROP. Please notify the event owner to refill the contract.`;
        } else if (fullErrorString.includes("not active")) {
          errorMsg = "The event is not active.";
        } else if (fullErrorString.includes("not started")) {
          errorMsg = "The event has not started yet.";
        } else if (fullErrorString.includes("ended")) {
          errorMsg = "The event has already ended.";
        } else if (fullErrorString.includes("rejected") || fullErrorString.includes("denied")) {
          errorMsg = "You rejected the transaction in your wallet.";
        } else {
          // Try to extract a more meaningful error message
          const simpleMsg = error.message.split('(')[0].trim();
          errorMsg += simpleMsg.length > 0 ? simpleMsg : "Unknown error";
          
          // If we're still getting a generic revert, let's show contract state info
          if (simpleMsg.includes("reverted") || simpleMsg.includes("unknown reason")) {
            errorMsg += "\n\nCRITICAL DEBUG - Event ID: " + currentEventId;
            errorMsg += "\nExists: " + (eventExists ? "Yes" : "No");
            errorMsg += "\nActive: " + (eventDetails?.active ? "Yes" : "No");
            errorMsg += "\nContract balance: " + formattedContractBalance + " CROP (needs " + requiredTokens + " CROP)";
            errorMsg += "\nTime window: " + (eventDetails ? new Date(eventDetails.startTime * 1000).toLocaleString() + " to " + new Date(eventDetails.endTime * 1000).toLocaleString() : "Unknown");
            errorMsg += "\n\nPlease copy this information and send it to the developer.";
          }
        }
      } else {
        errorMsg += "Unknown error type";
      }
      
      alert(errorMsg);
    } finally {
      setIsClaimingTokens(false);
    }
  };

  // Add refill tokens function
  const handleRefillTokens = async () => {
    if (!isConnected || !isOwner) {
      alert("Only the event owner can refill tokens.");
      return;
    }

    console.log("======== CONTRACT REFILL DEBUG ========");
    console.log("User token balance:", userTokenBalanceNumber);
    console.log("Contract token balance (raw):", contractBalanceNumber);
    console.log("Contract token balance (formatted):", formattedContractBalance, "CROP");
    console.log("Required tokens per user:", requiredTokens, "CROP");
    console.log("CropCircle contract address:", cropCircleAddress);
    console.log("CropToken contract address:", cropTokenAddress);

    if (!cropCircleAddress || !cropTokenAddress || !cropCircleContractData || !cropTokenContractData) {
      alert("Cannot find contract addresses. Please try again later.");
      return;
    }

    if (userTokenBalanceNumber <= 0) {
      alert("You don't have any CROP tokens in your wallet to send to the contract.");
      return;
    }

    // Calculate a better default amount - enough for 20 users minimum
    const suggestedAmount = Math.max(2000, Math.ceil(eventTokensClaimedAmount / 10**18) * 20).toFixed(0);
    const amount = prompt(`Enter amount of CROP tokens to add to the contract (needs approval):\n\nYour balance: ${userTokenBalanceNumber.toFixed(2)} CROP\nContract current balance: ${formattedContractBalance} CROP\nContract needs at least ${requiredTokens} CROP per user\n\nSuggested amount (for 20 users): ${suggestedAmount} CROP`, suggestedAmount);
    
    if (!amount) return;

    try {
      // Convert to wei (or the token's smallest unit)
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10**18));
      
      // Step 1: First approve the CropCircle contract to spend tokens
      alert("Step 1/2: You'll be asked to approve the contract to spend your CROP tokens.");
      
      try {
        // Approve tokens - using the contract hook directly and forcing the type
        const approval = await approveTokensFunction({
          functionName: "approve",
          args: [cropCircleAddress, amountBigInt],
        } as any);
        
        console.log("Approval transaction hash:", approval);
        alert("Approval successful! Now proceeding to transfer tokens.");
        
        // Step 2: Refill tokens - use a simple ethers.js approach
        alert(`Step 2/2: Now you'll be asked to confirm sending ${amount} CROP tokens to the contract.`);
        
        // Create a minimal ABI for just the function we need
        const minimalABI = [
          {
            "inputs": [
              {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
              }
            ],
            "name": "refillTokens",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ];
        
        // Get an Ethereum provider from the browser
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Create contract interface and encode the function call
        const contract = new ethers.Contract(cropCircleAddress as string, minimalABI, signer);
        
        // Call the contract function directly through ethers.js
        const transaction = await contract.refillTokens(amountBigInt);
        await transaction.wait();
        
        console.log("Refill transaction successful:", transaction.hash);
        alert(`Success! You've refilled the contract with ${amount} CROP tokens. Please wait for the token balance to update before claiming tokens.`);
      } catch (error) {
        console.error("Transaction failed:", error);
        throw error;
      }
      
    } catch (error) {
      console.error("Refill failed:", error);
      
      let errorMsg = "Failed to refill tokens. ";
      
      if (error instanceof Error) {
        const errorText = error.message.toLowerCase();
        
        if (errorText.includes("user rejected")) {
          errorMsg = "Transaction rejected in wallet. To refill tokens, you need to approve both transactions.";
        } else if (errorText.includes("insufficient")) {
          errorMsg = "You don't have enough CROP tokens in your wallet for this amount.";
        } else if (errorText.includes("allowance")) {
          errorMsg = "The approval transaction failed. Please try again and approve the contract to spend your tokens first.";
        } else if (errorText.includes("not found on abi")) {
          errorMsg = "The contract function 'refillTokens' is not available. Please contact the developer.";
        } else {
          errorMsg += error.message;
        }
      }
      
      alert(errorMsg);
    }
  };

  const eventStatusText = () => {
    if (!currentEventId) return "No Event";
    if (isLoadingEventDetails) return "Loading Event...";
    if (!eventDetails || eventDetails.startTime === 0) return "Invalid Event ID";
    if (!eventDetails.active) return "Event Inactive";
    if (eventDetails.startTime > Math.floor(Date.now() / 1000)) return "Not Started";
    if (eventDetails.endTime < Math.floor(Date.now() / 1000)) return "Event Ended";
    return "Event Active";
  };

  const statusTextOutput = eventStatusText();

  return (
    <>
    {/* Debugger UI - Remove for production */}
    {/* <div style={{ position: 'fixed', top: 0, left: 0, right:0, background: 'rgba(255,255,0,0.8)', padding: '5px', zIndex: 10000, fontSize: '10px', display:'flex', justifyContent:'space-around' }}>
      <span>ID: {currentEventId || "null"}</span>
      <span>Exists: {String(eventExists)}</span>
      <span>Claimable: {String(isEventCurrentlyClaimable)}</span>
      <span>Claimed: {String(userHasClaimed)}</span>
      <span>Status: {eventStatusText()}</span>
      <span>Balance For Event: {displayTokenBalance}</span>
      <span>Details: {eventDetails ? `Active: ${eventDetails.active}, Start: ${new Date(eventDetails.startTime * 1000).toLocaleTimeString()}, End: ${new Date(eventDetails.endTime * 1000).toLocaleTimeString()}` : "No Details"}</span>
    </div> */}
    <header className="max-w-4xl w-full mx-auto bg-white shadow-md mb-4 px-4">
      <div className="flex items-center justify-between h-[68px]">
        <div className="flex-shrink-0">
          {/* Logo */}
          <div className="flex items-center justify-center">
            <Image 
              src="/assets/wex 3.png" 
              alt="Dr Shill Logo" 
              width={120} 
              height={60} 
              priority
              className="object-contain"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && (
            <div className="py-2 px-4 bg-[#FFFCE9] rounded flex items-center gap-2">
              <Ticket className="h-5 w-5 text-yellow-600" />
              <span className="text-xl font-bold text-black">
                {Math.floor(displayTokenBalance)}
              </span>
            </div>
          )}
          
          {/* Contract balance warning for owners */}
          {isConnected && isOwner && contractBalanceNumber < (eventTokensClaimedAmount * 2) && (
            <button 
              onClick={handleRefillTokens} 
              disabled={isRefillPending}
              className="py-1 px-2 bg-amber-500 text-white text-xs rounded hover:bg-amber-600 disabled:bg-gray-400"
            >
              {isRefillPending ? "Refilling..." : "Low Contract Balance! Refill"}
            </button>
          )}
          
          {isConnected && currentEventId && statusTextOutput !== "Invalid Event ID" && (
            <div className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
              {statusTextOutput}
            </div>
          )}
          {isConnected && isOwner && !isEventPage && (
            <button onClick={() => setShowCreateEventDialog(true)} className="h-9 w-9 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center border-2 border-green-500" title="Create Event (Owner Only)">
              <PlusCircle className="h-5 w-5 text-green-700" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Claim Button: Show if connected, on an event page with currentEventId - More permissive logic */}
          {isConnected && currentEventId && isEventPage && (
            <button 
              onClick={handleClaimTokens} 
              disabled={
                isClaimingTokens || 
                isClaimWritePending || 
                isLoadingEventDetails || 
                isLoadingHasClaimed
              }
              className="py-2 px-3 bg-green-600 text-white rounded flex items-center gap-1 text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:opacity-60" 
              title="Claim CROP tokens for this event"
            >
              <Gift className="h-4 w-4" />
              <span>
                {isClaimingTokens || isClaimWritePending 
                  ? "CLAIMING..." 
                  : userHasClaimed 
                    ? "RECLAIM"
                    : isLoadingEventDetails || isLoadingHasClaimed
                      ? "LOADING..."
                      : "CLAIM"
                }
              </span>
            </button>
          )}
          <button onClick={handleConnectClick} className="py-2 px-4 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded flex items-center gap-2 text-sm font-medium transition">
            <Key className="h-5 w-5" />
            <span>
              {isConnected && address ? 
                `0x${address.slice(2, 6)}...${address.slice(-4)}` : 
                'CONNECT'
              }
            </span>
          </button>
        </div>
      </div>
      <WalletDialog open={showWalletDialog} onOpenChange={setShowWalletDialog} />
      <CreateEventDialog
        open={showCreateEventDialog}
        onOpenChange={setShowCreateEventDialog}
        isOwner={isOwner}
        onEventCreated={(eventId) => {
          if (isValidEventIdFormat(eventId)) {
            setCurrentEventId(eventId);
            localStorage.setItem('currentEventId', eventId);
          } else {
            console.error("Header: onEventCreated received invalid eventId format:", eventId);
          }
        }}
      />
    </header>
    
    {/* Persistent Refill Button for Owners - Always visible at bottom of page */}
    {isConnected && isOwner && !isEventPage && (
      <div className="fixed bottom-4 left-0 right-0 flex justify-center z-10">
        <button 
          onClick={handleRefillTokens} 
          disabled={isRefillPending || isApproving}
          className="py-2 px-4 bg-amber-500 text-white rounded-md shadow-lg hover:bg-amber-600 disabled:bg-gray-400 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-coins">
            <circle cx="8" cy="8" r="6" />
            <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
            <path d="M7 6h1v4" />
            <path d="m16.71 13.88.7.71-2.82 2.82" />
          </svg>
          {isRefillPending || isApproving ? "Processing..." : "Refill Contract Tokens"}
        </button>
      </div>
    )}
    </>
  );
}; 