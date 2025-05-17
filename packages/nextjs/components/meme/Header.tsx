"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { CreateEventDialog } from "./CreateEventDialog";
import { ethers } from "ethers";
import { Gift, Key, PlusCircle, Ticket } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { WalletDialog } from "~~/components/WalletDialog";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

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
  if (typeof id !== "string") return false;
  const trimmedId = id.trim();
  // Check for '0x' prefix, 66 characters total (0x + 64 hex), and valid hex characters.
  return trimmedId.startsWith("0x") && trimmedId.length === 66 && /^[0-9a-fA-F]+$/.test(trimmedId.substring(2));
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
    const eventIdFromURL = searchParams?.get("id");
    const storedEventId = localStorage.getItem("currentEventId");
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
      localStorage.setItem("currentEventId", newEventIdToSet);
    } else if (!newEventIdToSet && currentEventId !== null) {
      setCurrentEventId(null); // Clear if no valid ID is found
    }
  }, [searchParams, currentEventId]);

  const { data: ownerAddress } = useScaffoldReadContract({
    contractName: "CropCircle",
    functionName: "owner",
  });

  const isOwner = Boolean(
    isConnected && address && ownerAddress && address.toLowerCase() === String(ownerAddress).toLowerCase(),
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
    currentEventId && isValidEventIdFormat(currentEventId) ? currentEventId : undefined;

  const { data: rawEventDetails, isLoading: isLoadingEventDetails } = useScaffoldReadContract({
    contractName: "CropCircle",
    functionName: "getEventDetails",
    args: [bytes32EventId ?? undefined] as const,
    watch: true,
  });

  const parseEventDetails = (): EventDetails | null => {
    if (isLoadingEventDetails || !rawEventDetails || !Array.isArray(rawEventDetails) || rawEventDetails.length < 8)
      return null;
    if (Number(rawEventDetails[0] || 0) === 0 && bytes32EventId) {
      console.warn(`Event details for ID ${bytes32EventId} appear to be zeroed. Event might not exist.`);
      return null;
    }
    try {
      return {
        startTime: Number(rawEventDetails[0] || 0),
        endTime: Number(rawEventDetails[1] || 0),
        qrCodeHash: String(rawEventDetails[2] || ""),
        active: Boolean(rawEventDetails[3]),
        memeCount: Number(rawEventDetails[4] || 0),
        winningTokenAddress: String(rawEventDetails[5] || ""),
        winningMemeId: Number(rawEventDetails[6] || 0),
        isFinalized: Boolean(rawEventDetails[7]),
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
    args: [bytes32EventId ?? undefined, (address as `0x${string}` | undefined) ?? undefined] as any,
    watch: true,
  });

  const userHasClaimed = Boolean(hasClaimedData);
  
  // Get the INITIAL_TOKEN_AMOUNT directly from the contract to ensure we're using the exact same value
  const { data: initialTokenAmountRaw } = useScaffoldReadContract({
    contractName: "CropCircle",
    functionName: "INITIAL_TOKEN_AMOUNT",
    watch: true,
  });
  
  // Use this for display purposes - convert from wei to human-readable format
  const eventTokensClaimedAmount = initialTokenAmountRaw 
    ? Number(initialTokenAmountRaw.toString()) / 10**18
    : 100; // Fallback if INITIAL_TOKEN_AMOUNT is not found/readable or is zero
  
  const displayTokenBalance = eventDetails && eventDetails.active && userHasClaimed ? eventTokensClaimedAmount : 0;

  const { writeContractAsync: provideInitialTokens, isPending: isClaimWritePending } =
    useScaffoldWriteContract("CropCircle");
  // We need the refill pending state but don't directly use the function (it's used via ethers.js)
  const { isPending: isRefillPending } = useScaffoldWriteContract("CropCircle");
  const { writeContractAsync: approveTokensFunction, isPending: isApproving } = useScaffoldWriteContract("CropToken");

  // Add a user token balance check
  const { data: userTokenBalance } = useScaffoldReadContract({
    contractName: "CropToken",
    functionName: "balanceOf",
    args: address ? [address] : [undefined],
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

  const userTokenBalanceNumber = userTokenBalance ? Number(userTokenBalance.toString()) / 10 ** 18 : 0;

  const handleConnectClick = () => {
    if (isConnected) disconnect();
    else setShowWalletDialog(true);
  };

  const eventExists = Boolean(eventDetails && eventDetails.startTime > 0);

  // Modified logic to be more lenient for newly created events
  const isEventCurrentlyClaimable = Boolean(
    // If we have event details at all and it's marked as active, consider it claimable
    // This is more lenient than checking timestamps which might be misconfigured
    eventDetails && eventDetails.active,
  );

  // Determine whether we're on the event page or main page
  const isEventPage = Boolean(searchParams?.get("id"));

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
      isLoadingHasClaimed,
    });
  }, [
    eventDetails,
    eventExists,
    isEventCurrentlyClaimable,
    userHasClaimed,
    isLoadingEventDetails,
    isLoadingHasClaimed,
  ]);

  // Add a contract balance check
  const { data: contractTokenBalance } = useScaffoldReadContract({
    contractName: "CropCircle",
    functionName: "getContractTokenBalance",
    watch: true,
  });

  // Convert to BigInt for precise comparison - both values should be in wei format with 18 decimals
  const contractBalanceBigInt = contractTokenBalance ? BigInt(contractTokenBalance.toString()) : BigInt(0);
  
  // Convert to BigInt to match the contract's expectation - using the raw value directly from the contract
  const requiredTokensBigInt = initialTokenAmountRaw ? BigInt(initialTokenAmountRaw.toString()) : BigInt(100 * 10**18);

  // CAUTION: This frontend check is just informational - the actual check happens in the contract
  // We'll attempt the transaction regardless of this check
  const hasEnoughTokens = contractBalanceBigInt >= requiredTokensBigInt;

  // Keep number format for display calculations
  const contractBalanceNumber = Number(contractBalanceBigInt.toString());
  const requiredTokensNumber = Number(requiredTokensBigInt.toString());

  // Format the balances for display - divide by 10^18 to convert from wei to token units
  const formattedContractBalance = (contractBalanceNumber / 10 ** 18).toFixed(2);
  const requiredTokens = (requiredTokensNumber / 10 ** 18).toFixed(2);

  // Add debug logging for balance info - this will run on each render
  useEffect(() => {
    if (contractTokenBalance) {
      console.log("========== CONTRACT BALANCE DEBUG ==========");
      console.log("Contract balance (Wei):", contractBalanceBigInt.toString());
      console.log("Contract balance (Tokens):", formattedContractBalance);
      console.log("Required per user (Wei):", requiredTokensBigInt.toString());
      console.log("Required per user (Tokens):", requiredTokens);
      console.log("Has enough based on our check:", hasEnoughTokens ? "Yes" : "No");
      if (!hasEnoughTokens) {
        console.warn("WARNING: Contract appears to have insufficient balance for claims!");
        console.log("Difference needed:", (Number(requiredTokensBigInt) - Number(contractBalanceBigInt)) / 10**18, "CROP");
      }
      console.log("===========================================");
    }
  }, [contractBalanceBigInt, requiredTokensBigInt, formattedContractBalance, requiredTokens, hasEnoughTokens]);

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

    // Check if event exists and is valid
    if (!eventDetails) {
      alert("Unable to fetch event details. Please try again later.");
      return;
    }

    // Current timestamp for time-based checks
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Add extensive debugging information
    console.log("============ CLAIM DEBUG INFO ============");
    console.log("Event ID:", currentEventId);
    console.log("Event ID type:", typeof currentEventId);
    console.log("User address:", address);
    console.log("Event exists:", eventExists);
    console.log("Event is active:", eventDetails?.active);
    console.log("Event start time:", eventDetails?.startTime, "current:", currentTimestamp, "valid:", eventDetails?.startTime <= currentTimestamp);
    console.log("Event end time:", eventDetails?.endTime, "current:", currentTimestamp, "valid:", eventDetails?.endTime >= currentTimestamp);
    console.log("User claimed:", userHasClaimed);
    console.log("Contract balance (wei):", contractBalanceBigInt.toString());
    console.log("Contract balance (formatted):", formattedContractBalance, "CROP");
    console.log("Required tokens (wei):", requiredTokensBigInt.toString());
    console.log("Required tokens (formatted):", requiredTokens, "CROP");
    console.log("Has enough tokens (informational only):", hasEnoughTokens ? "Yes" : "No");

    // Additional safety checks - just for better UX, not essential
    if (userHasClaimed) {
      const shouldProceed = confirm(
        "Our records show you've already claimed tokens for this event. Do you still want to try claiming again? (The contract will verify this regardless)"
      );
      if (!shouldProceed) return;
    }

    // Ensure the event ID is properly formatted for the contract
    let formattedEventId = currentEventId;
    
    // Make sure it has the '0x' prefix
    if (formattedEventId && !formattedEventId.startsWith('0x')) {
      formattedEventId = '0x' + formattedEventId;
      console.log("Added 0x prefix to event ID:", formattedEventId);
    }
    
    // Ensure it's the correct length (bytes32 = 32 bytes = 64 hex chars + '0x' prefix = 66 chars)
    if (formattedEventId && formattedEventId.length !== 66) {
      console.warn("Event ID length is not 66 characters (including 0x prefix):", formattedEventId.length);
      
      // If it's too short, pad with zeros to 66 chars (pad after 0x prefix)
      if (formattedEventId.length < 66) {
        const paddingNeeded = 66 - formattedEventId.length;
        const padding = '0'.repeat(paddingNeeded);
        formattedEventId = formattedEventId.substring(0, 2) + padding + formattedEventId.substring(2);
        console.log("Padded event ID to correct length:", formattedEventId);
      } else if (formattedEventId.length > 66) {
        // If it's too long, truncate to 66 chars (risky but better than failing)
        formattedEventId = formattedEventId.substring(0, 66);
        console.log("Truncated event ID to correct length:", formattedEventId);
      }
    }
    
    // Final ID check
    if (!isValidEventIdFormat(formattedEventId)) {
      console.error("Event ID format is still invalid after corrections:", formattedEventId);
      // Continue anyway - let the contract handle it
    }

    setIsClaimingTokens(true);
    try {
      // Log important details before the call
      console.log("===== CLAIM TRANSACTION ATTEMPT =====");
      console.log("Formatted Event ID:", formattedEventId);
      console.log("Raw Event ID from URL:", searchParams?.get("id"));
      
      // Attempt the claim without frontend balance checks
      const tx = await provideInitialTokens({
        functionName: "provideInitialTokens",
        args: [formattedEventId as any],
      });

      console.log("Claim transaction hash:", tx);
      alert("CROP tokens claimed successfully! Transaction: " + tx);
    } catch (error) {
      console.error("DETAILED ERROR:", error);
      
      // Get a clean string representation of the error
      const errorString = typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error);
      console.log("Full error details:", errorString);

      // Extract as much info as possible - simplify for users
      let errorMsg = "";

      if (error instanceof Error) {
        // Check for common error messages but display simpler messages to users
        const fullErrorString = errorString.toLowerCase();

        if (fullErrorString.includes("already claimed")) {
          errorMsg = "You have already claimed tokens for this event.";
        } else if (fullErrorString.includes("insufficient") || fullErrorString.includes("balance")) {
          // Simplify the message - don't expose technical details to users
          errorMsg = "Unable to claim tokens at this time. Please try again later or contact the event organizer.";
        } else if (fullErrorString.includes("not active")) {
          errorMsg = "The event is not active.";
        } else if (fullErrorString.includes("not started")) {
          errorMsg = "The event has not started yet.";
        } else if (fullErrorString.includes("ended")) {
          errorMsg = "The event has already ended.";
        } else if (fullErrorString.includes("rejected") || fullErrorString.includes("denied")) {
          errorMsg = "You rejected the transaction in your wallet.";
        } else {
          // Just show a generic message for users
          errorMsg = "Unable to claim tokens at this time. Please try again later.";
          
          // But log the actual error for debugging
          console.error("Raw contract error:", error.message);
        }
      } else {
        errorMsg = "Unable to claim tokens at this time. Please try again later.";
      }

      alert(errorMsg);
    } finally {
      setIsClaimingTokens(false);
    }
  };

  // Modify handleRefillTokens to make it more effective
  const handleRefillTokens = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    console.log("======== CONTRACT REFILL DEBUG ========");
    console.log("User token balance:", userTokenBalanceNumber);
    console.log("Contract token balance (wei):", contractBalanceBigInt.toString());
    console.log("Contract token balance (formatted):", formattedContractBalance, "CROP");
    console.log("Required tokens per user (formatted):", requiredTokens, "CROP");
    console.log("CropCircle contract address:", cropCircleAddress);
    console.log("CropToken contract address:", cropTokenAddress);
    console.log("Is owner:", isOwner);
    
    // Allow non-owners to request a refill from the owner
    if (!isOwner) {
      alert(`This contract needs more tokens to process claims. Please contact the owner to refill it.\n\nCurrent balance: ${formattedContractBalance} CROP\nNeeded per user: ${requiredTokens} CROP`);
      return;
    }

    if (!cropCircleAddress || !cropTokenAddress || !cropCircleContractData || !cropTokenContractData) {
      alert("Cannot find contract addresses. Please try again later.");
      return;
    }

    if (userTokenBalanceNumber <= 0) {
      alert("You don't have any CROP tokens in your wallet to send to the contract.");
      return;
    }

    // Calculate a better default amount - enough for at least 20 users
    // We need to use the raw token amount divided by 10^18 since userTokenBalanceNumber is already in human-readable format
    const requiredPerUser = Number(requiredTokensBigInt) / 10**18;
    // Calculate how many users the contract can currently support
    const currentUserCapacity = Math.floor(Number(contractBalanceBigInt) / Number(requiredTokensBigInt));
    
    // Make more obvious suggestions based on actual balance
    const minimumSuggestedUsers = Math.max(20, currentUserCapacity + 10);
    const suggestedAmount = Math.ceil(requiredPerUser * minimumSuggestedUsers).toFixed(0);
    
    const amount = prompt(
      `CONTRACT REFILL REQUIRED!\n\nCurrent balance: ${formattedContractBalance} CROP (can support ${currentUserCapacity} users)\nNeeded per user: ${requiredTokens} CROP\n\nEnter amount of CROP tokens to add:\nYour balance: ${userTokenBalanceNumber.toFixed(2)} CROP\n\nRecommended amount (for ${minimumSuggestedUsers} users): ${suggestedAmount} CROP`,
      suggestedAmount,
    );

    if (!amount) return;

    try {
      // Convert to wei (or the token's smallest unit) - multiply by 10^18
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** 18));
      console.log("Amount to refill (wei):", amountBigInt.toString());

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
            inputs: [
              {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
              },
            ],
            name: "refillTokens",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
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
        alert(
          `Success! You've refilled the contract with ${amount} CROP tokens. Please wait for the token balance to update before claiming tokens.`,
        );
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
          errorMsg =
            "The approval transaction failed. Please try again and approve the contract to spend your tokens first.";
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
                <span className="text-xl font-bold text-black">{Math.floor(displayTokenBalance)}</span>
              </div>
            )}

            {/* Only show refill button to owners - not regular users */}
            {isConnected && isOwner && contractBalanceNumber < eventTokensClaimedAmount * 2 && (
              <button
                onClick={handleRefillTokens}
                disabled={isRefillPending}
                className="py-1 px-2 bg-amber-500 text-white text-xs rounded hover:bg-amber-600 disabled:bg-gray-400"
              >
                {isRefillPending ? "Refilling..." : "Low Contract Balance! Refill"}
              </button>
            )}

            {/* Only show event status on event pages, not the main page */}
            {isConnected && currentEventId && statusTextOutput !== "Invalid Event ID" && isEventPage && (
              <div className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">{statusTextOutput}</div>
            )}
            
            {isConnected && isOwner && !isEventPage && (
              <button
                onClick={() => setShowCreateEventDialog(true)}
                className="h-9 w-9 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center border-2 border-green-500"
                title="Create Event (Owner Only)"
              >
                <PlusCircle className="h-5 w-5 text-green-700" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Claim Button: Show if connected, on an event page with currentEventId - More permissive logic */}
            {isConnected && currentEventId && isEventPage && (
              <button
                onClick={handleClaimTokens}
                disabled={isClaimingTokens || isClaimWritePending || isLoadingEventDetails || isLoadingHasClaimed}
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
                        : "CLAIM"}
                </span>
              </button>
            )}
            <button
              onClick={handleConnectClick}
              className="py-2 px-4 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded flex items-center gap-2 text-sm font-medium transition"
            >
              <Key className="h-5 w-5" />
              <span>{isConnected && address ? `0x${address.slice(2, 6)}...${address.slice(-4)}` : "CONNECT"}</span>
            </button>
          </div>
        </div>
        <WalletDialog open={showWalletDialog} onOpenChange={setShowWalletDialog} />
        <CreateEventDialog
          open={showCreateEventDialog}
          onOpenChange={setShowCreateEventDialog}
          isOwner={isOwner}
          onEventCreated={eventId => {
            if (isValidEventIdFormat(eventId)) {
              setCurrentEventId(eventId);
              localStorage.setItem("currentEventId", eventId);
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-coins"
            >
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
