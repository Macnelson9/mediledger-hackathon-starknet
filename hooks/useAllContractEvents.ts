// hooks/useAllContractEvents.ts
"use client";
import { contractAddress } from "@/abi/Mediledger";
import { useEvents } from "@starknet-react/core";

export function useAllContractEvents() {
  const { data, isLoading, error, isSuccess } = useEvents({
    address: contractAddress,
    eventName: "AccessRequested",
    fromBlock: 1692524,
    toBlock: "latest",
    pageSize: 10,
    enabled: true,
    refetchInterval: false,
    retry: 0,
    retryDelay: 0,
  });

  return {
    events: data,
    isLoading,
    error,
    isSuccess,
  };
}
