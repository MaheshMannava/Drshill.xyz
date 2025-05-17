import { useAccount } from 'wagmi';
import { useScaffoldReadContract } from '~~/hooks/scaffold-eth';

export const useIsOwner = () => {
  const { address } = useAccount();
  
  const { data: owner } = useScaffoldReadContract({
    contractName: "CropCircle",
    functionName: "owner",
  });

  return {
    isOwner: Boolean(owner && address && owner === address),
  };
}; 