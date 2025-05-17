import { useAccount } from 'wagmi';
import { useScaffoldReadContract } from '~~/hooks/scaffold-eth';
import { useEventStore } from '~~/hooks/useEventStore';

export const useTicketBalance = () => {
  const { address, isConnected } = useAccount();
  const { currentEventId } = useEventStore();
  
  // Get token balance for the connected user
  const { data: balance, isLoading, refetch } = useScaffoldReadContract({
    contractName: "CropToken",
    functionName: "balanceOf",
    args: address ? [address] : [undefined],
    watch: true,
  });

  // Check if user has claimed tokens for this event
  const { data: claimedStatus } = useScaffoldReadContract({
    contractName: "CropCircle",
    functionName: "hasUserClaimedTokens" as any,
    args: (currentEventId && address ? [currentEventId, address] as const : undefined) as any,
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