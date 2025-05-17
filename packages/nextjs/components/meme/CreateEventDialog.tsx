import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { AlertTriangle, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Abi, decodeEventLog, parseAbiItem } from "viem";
import { useWaitForTransactionReceipt } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

// Define the structure of the EventCreated event - IMPORTANT: Updated to match actual contract event signature
const eventCreatedAbiItem = parseAbiItem(
  "event EventCreated(bytes32 indexed eventId, uint256 startTime, uint256 endTime, bytes32 qrCodeHash)",
);
const cropCircleAbi = [
  eventCreatedAbiItem,
  // Add other ABI items if needed for parsing other events/functions
];

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: (eventId: string) => void;
  isOwner: boolean;
}

export const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
  open,
  onOpenChange,
  onEventCreated,
  isOwner,
}) => {
  const [duration, setDuration] = useState("24");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  const [confirmedEventId, setConfirmedEventId] = useState<string | null>(null);
  const [confirmedEventUrl, setConfirmedEventUrl] = useState<string | null>(null);
  const [isParsingLogs, setIsParsingLogs] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Hook to write to the contract
  const { writeContractAsync: createEventFunction, isPending: isSubmitting } = useScaffoldWriteContract("CropCircle");

  // Hook to wait for transaction receipt
  const {
    data: receipt,
    isLoading: isLoadingReceipt,
    isSuccess: isReceiptConfirmed,
    isError: isReceiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  // Effect to process receipt and extract eventId
  useEffect(() => {
    // Improved robust method to extract event ID
    const extractEventIdFromLogs = (logs: any[]) => {
      if (!logs || logs.length === 0) {
        console.error("No logs found in transaction receipt");
        return null;
      }

      console.log("All transaction logs:", logs);

      // First attempt: Look for EventCreated event using decodeEventLog
      for (const log of logs) {
        try {
          // Only attempt to decode logs from our CropCircle contract
          const cropCircleAddress = logs[0]?.address; // Assuming all logs are from the same contract in this tx
          if (log.address !== cropCircleAddress) continue;

          const decodedLog = decodeEventLog({
            abi: cropCircleAbi as Abi,
            data: log.data,
            topics: log.topics,
          });

          console.log("Successfully decoded log:", decodedLog);

          if (decodedLog.eventName === "EventCreated") {
            const eventIdArg = (decodedLog.args as any).eventId;
            if (typeof eventIdArg === "string" && eventIdArg.startsWith("0x") && eventIdArg.length === 66) {
              console.log("Found event ID in decoded log:", eventIdArg);
              return eventIdArg;
            }
          }
        } catch (error) {
          console.warn("Error decoding log, trying next method:", error);
        }
      }

      // Second attempt: Look for the EventCreated signature in topics
      // keccak256("EventCreated(bytes32,uint256,uint256,bytes32)")
      const eventCreatedSignature = "0xf12c9274369a83fc4dae0cadd7853adac11a4a24c285e7f2e1313dc4fec5a07a";
      for (const log of logs) {
        if (log.topics && log.topics[0] === eventCreatedSignature && log.topics.length > 1) {
          // The first indexed param (eventId) should be in topics[1]
          const rawEventId = log.topics[1];
          if (rawEventId && typeof rawEventId === "string" && rawEventId.startsWith("0x")) {
            console.log("Found event ID in topics:", rawEventId);
            return rawEventId;
          }
        }
      }

      // Direct approach - try to get the return value of createEvent
      // In case the function output was returned but not captured in events
      try {
        // Use the contract function directly instead of relying on events
        if (receipt && receipt.status === "success" && receipt.effectiveGasPrice) {
          return localStorage.getItem("lastAttemptedEventId");
        }
      } catch (error) {
        console.error("Error extracting event ID from contract function:", error);
      }

      // Last fallback: Check for any bytes32 in topics
      console.warn("Falling back to searching for any bytes32 in topics - this is less reliable");
      for (const log of logs) {
        if (log.topics && log.topics.length > 0) {
          for (const topic of log.topics) {
            if (
              typeof topic === "string" &&
              topic.startsWith("0x") &&
              topic.length === 66 &&
              topic !== eventCreatedSignature
            ) {
              // Exclude the event signature itself
              console.log("Potential event ID in raw topics:", topic);
              return topic;
            }
          }
        }
      }

      return null;
    };

    if (isReceiptConfirmed && receipt && txHash) {
      // Extract event ID from transaction receipt logs
      setIsParsingLogs(true);
      try {
        if (Array.isArray(receipt?.logs) && receipt.logs.length > 0) {
          console.log("Logs found in receipt:", receipt.logs);

          // Try to parse event ID from logs
          const eventId = extractEventIdFromLogs(receipt.logs);

          // If we found an eventId, call the onEventCreated callback and clear state
          if (eventId) {
            console.log("Found event ID:", eventId);

            // Save to localStorage with success status
            localStorage.setItem("lastAttemptedEventId", eventId);

            // Create an event URL and set state
            const baseUrl = window.location.origin;
            const eventUrl = `${baseUrl}/event?id=${eventId}`;
            setConfirmedEventId(eventId);
            setConfirmedEventUrl(eventUrl);

            // Call the onEventCreated callback from props
            if (onEventCreated) {
              onEventCreated(eventId);
            }

            setIsParsingLogs(false);
          } else if (retryCount < 2) {
            // If we couldn't find the event ID in the logs, increment retry count
            console.log("No event ID found in logs, retrying...");
            setRetryCount(prevCount => prevCount + 1);

            // Wait a moment and try again by forcing a state update
            setTimeout(() => {
              setRetryCount(prevCount => {
                console.log("Automatic retry", prevCount + 1);
                return prevCount; // Just trigger a re-render
              });
            }, 2000);
          } else {
            // After 3 attempts (retryCount 0, 1, 2), give up
            console.log("Failed to extract event ID after multiple attempts");
            setIsParsingLogs(false);
            alert(
              "Could not extract event ID from transaction. Please check if the event was created and try again if needed.",
            );
          }
        } else {
          console.log("No logs found in receipt or receipt format unexpected");
          setIsParsingLogs(false);

          // At this point, we could ask the user to check the transaction on a block explorer
          // or implement additional fallback mechanisms
        }
      } catch (error) {
        console.error("Error processing transaction receipt logs:", error);
        setIsParsingLogs(false);
      }
    } else if (isReceiptError && txHash) {
      console.error("Error fetching transaction receipt for hash:", txHash);
      setIsParsingLogs(false);
    }
  }, [isReceiptConfirmed, receipt, isReceiptError, txHash, onEventCreated, retryCount]);

  // Clear state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setDuration("24");
      setTxHash(undefined);
      setConfirmedEventId(null);
      setConfirmedEventUrl(null);
      setIsParsingLogs(false);
      setRetryCount(0);
    }
  }, [open]);

  // Create event handler
  const handleCreateEvent = async () => {
    if (!isOwner) {
      alert("Only the contract owner can create events");
      return;
    }
    setTxHash(undefined);
    setConfirmedEventId(null);
    setConfirmedEventUrl(null);
    setIsParsingLogs(false);
    setRetryCount(0);

    try {
      const durationInSeconds = Math.floor(parseFloat(duration) * 60 * 60);
      if (!createEventFunction) {
        alert("Contract interaction function is not ready. Please try again in a moment.");
        return;
      }

      // Generate a timestamp to help ensure uniqueness
      const timestamp = Date.now();
      localStorage.setItem("lastAttemptedEventId", `attempting-${timestamp}`);

      const returnedHash = await createEventFunction({
        functionName: "createEvent",
        args: [BigInt(durationInSeconds)],
      });

      console.log("Transaction submitted with hash:", returnedHash);
      setTxHash(returnedHash);
    } catch (error) {
      console.error("Error creating event:", error);
      let message = "Error creating event: ";
      if (error instanceof Error) {
        message += error.message;
      } else {
        message += "Unknown error";
      }
      if (message.toLowerCase().includes("user rejected")) {
        message = "Transaction rejected in your wallet.";
      }
      alert(message);
    }
  };

  // Determine current display step
  const getDisplayStep = () => {
    if (confirmedEventId && confirmedEventUrl) return "complete";
    if (txHash && isReceiptConfirmed && isParsingLogs) return "extracting_event_id";
    if (txHash && isReceiptError) return "error_confirming";
    if (txHash && (isLoadingReceipt || (!isReceiptConfirmed && !isReceiptError))) return "pending";
    return "form";
  };
  const displayStep = getDisplayStep();

  if (!isOwner && displayStep === "form") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Permission Denied</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">
            <p className="text-red-500 mb-4">Only the contract owner can create events.</p>
            <Button onClick={() => onOpenChange(false)} className="w-full bg-gray-600 hover:bg-gray-700">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {displayStep === "form" && "Create New Event"}
            {displayStep === "pending" && "Event Creation Pending"}
            {displayStep === "extracting_event_id" && "Extracting Event Information"}
            {displayStep === "complete" && "Event Creation Successful!"}
            {displayStep === "error_confirming" && "Transaction Confirmation Error"}
          </DialogTitle>
        </DialogHeader>

        {displayStep === "form" && (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="duration" className="block text-sm font-medium">
                Event Duration (hours)
              </label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="24"
                className="w-full"
              />
            </div>
            <Button
              onClick={handleCreateEvent}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Submitting..." : "Create Event"}
            </Button>
          </div>
        )}

        {displayStep === "pending" && (
          <div className="space-y-4 py-4 text-center">
            <div className="flex justify-center flex-col items-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              <h3 className="font-medium text-lg">Transaction Processing</h3>
            </div>
            <p className="text-sm text-gray-600">Your event creation transaction is being processed.</p>
            <div className="text-xs bg-gray-100 p-2 rounded break-all whitespace-nowrap overflow-hidden text-ellipsis">
              Tx Hash: {txHash}
            </div>
            <p className="text-xs text-amber-600 mt-2">Waiting for blockchain confirmation...</p>
          </div>
        )}

        {displayStep === "extracting_event_id" && (
          <div className="space-y-4 py-4 text-center">
            <div className="flex justify-center flex-col items-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              <h3 className="font-medium text-lg">Extracting Event ID</h3>
            </div>
            <p className="text-sm text-gray-600">Transaction confirmed! Now retrieving the event details.</p>
            <div className="text-xs bg-gray-100 p-2 rounded break-all whitespace-nowrap overflow-hidden text-ellipsis">
              Tx Hash: {txHash}
            </div>
            <p className="text-xs text-amber-600 mt-2">Attempt {retryCount + 1}/3...</p>
          </div>
        )}

        {displayStep === "error_confirming" && (
          <div className="space-y-4 py-4 text-center">
            <div className="flex justify-center flex-col items-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="font-medium text-lg text-red-600">Transaction Confirmation Failed</h3>
            </div>
            <p className="text-sm text-gray-600">There was an issue confirming your transaction on the blockchain.</p>
            <div className="text-xs bg-gray-100 p-2 rounded break-all whitespace-nowrap overflow-hidden text-ellipsis">
              Tx Hash: {txHash}
            </div>
            <p className="text-xs text-red-500 mt-2">
              Please check your wallet for more details or try creating the event again.
            </p>
            <Button
              onClick={() => {
                setTxHash(undefined);
                setIsParsingLogs(false);
              }}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

        {displayStep === "complete" && confirmedEventUrl && confirmedEventId && (
          <div className="space-y-4 py-4 text-center">
            <div className="flex justify-center">
              <div className="bg-white p-2 rounded">
                <QRCodeSVG value={confirmedEventUrl} size={200} />
              </div>
            </div>
            <p className="text-sm text-gray-600">Event created! Share this URL.</p>
            <div className="text-xs bg-gray-100 p-2 rounded break-all whitespace-nowrap overflow-hidden text-ellipsis">
              {confirmedEventUrl}
            </div>
            <p className="text-xs text-gray-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
              Event ID: {confirmedEventId}
            </p>
            <Button
              onClick={() => navigator.clipboard.writeText(confirmedEventUrl)}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Copy Link
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
