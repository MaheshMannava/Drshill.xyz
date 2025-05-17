import { useAccount } from 'wagmi';
import { useScaffoldContract, useScaffoldReadContract } from '~~/hooks/scaffold-eth';
import { useEventStore } from '~~/hooks/useEventStore';

export const useTicketBalance = () => {
  const { address, isConnected } = useAccount();
  const { currentEventId } = useEventStore();
  
  // Get token balance for the connected user
  const { data: balance, isLoading, refetch } = useScaffoldReadContract({
    contractName: "CropCircle",
    functionName: "getTokenBalance",
    args: address ? [address] : undefined,
    enabled: Boolean(isConnected && address),
    watch: true,
  });

  // Check if user has claimed tokens for this event
  const { data: claimedStatus } = useScaffoldReadContract({
    contractName: "CropCircle",
    functionName: "hasClaimedTokens",
    args: currentEventId && address ? [currentEventId, address] : undefined,
    enabled: Boolean(isConnected && address && currentEventId),
  });

  // Convert bigint to number with proper decimal formatting
  const formattedBalance = balance ? Number(balance / BigInt(10**18)) : 0;

  return {
    ticketBalance: formattedBalance,
    isLoading,
    refetchBalance: refetch,
    hasClaimedTokens: Boolean(claimedStatus),
  };
}; 