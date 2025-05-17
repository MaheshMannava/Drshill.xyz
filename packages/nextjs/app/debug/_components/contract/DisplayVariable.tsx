"use client";

import { useEffect, useState } from "react";
import { InheritanceTooltip } from "./InheritanceTooltip";
import { displayTxResult } from "./utilsDisplay";
import { Abi, AbiFunction } from "abitype";
import { Address } from "viem";
import { useReadContract } from "wagmi";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useAnimationConfig } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

type DisplayVariableProps = {
  contractAddress: Address;
  abiFunction: AbiFunction;
  refreshDisplayVariables: boolean;
  inheritedFrom?: string;
  abi: Abi;
};

export const DisplayVariable = ({
  contractAddress,
  abiFunction,
  refreshDisplayVariables,
  abi,
  inheritedFrom,
}: DisplayVariableProps) => {
  const { targetNetwork } = useTargetNetwork();
  const [initialLoad, setInitialLoad] = useState(true);

  const {
    data: result,
    isFetching,
    refetch,
    error,
  } = useReadContract({
    address: contractAddress,
    functionName: abiFunction.name,
    abi: abi,
    chainId: targetNetwork.id,
    query: {
      retry: false,
      enabled: false, // Disable auto-fetching to prevent initial errors
    },
  });

  const { showAnimation } = useAnimationConfig(result);

  useEffect(() => {
    // Safe initial fetch with error handling
    const safeRefetch = async () => {
      try {
        await refetch();
      } catch (e) {
        // Silent error on initial load
        console.log(`Error fetching ${abiFunction.name}:`, e);
      } finally {
        setInitialLoad(false);
      }
    };
    
    safeRefetch();
  }, [refetch, refreshDisplayVariables, abiFunction.name]);

  useEffect(() => {
    if (error && !initialLoad) {
      const parsedError = getParsedError(error);
      notification.error(parsedError);
    }
  }, [error, initialLoad]);

  return (
    <div className="space-y-1 pb-2">
      <div className="flex items-center">
        <h3 className="font-medium text-lg mb-0 break-all">{abiFunction.name}</h3>
        <button className="btn btn-ghost btn-xs" onClick={async () => await refetch()}>
          {isFetching ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <ArrowPathIcon className="h-3 w-3 cursor-pointer" aria-hidden="true" />
          )}
        </button>
        <InheritanceTooltip inheritedFrom={inheritedFrom} />
      </div>
      <div className="text-base-content/80 flex flex-col items-start">
        <div>
          <div
            className={`break-all block transition bg-transparent ${
              showAnimation ? "bg-warning rounded-sm animate-pulse-fast" : ""
            }`}
          >
            {error && !initialLoad ? "Error: Contract call failed" : displayTxResult(result)}
          </div>
        </div>
      </div>
    </div>
  );
};
