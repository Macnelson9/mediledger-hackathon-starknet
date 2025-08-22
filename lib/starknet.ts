/* eslint-disable @typescript-eslint/no-explicit-any */
import { RpcProvider, Contract, Account } from "starknet";
import { MEDILEDGER_ABI } from "@/abi/Mediledger";
import {
  useContract,
  useReadContract,
  useSendTransaction,
  useTransactionReceipt,
} from "@starknet-react/core";
import { useMemo } from "react";

const contractAddress =
  "0x007048183ef958ea028cc7739ef23d97922802459d3e09ee3801bb3d2467f544";

// // Connect to Starknet testnet via RPC
// export const provider = new RpcProvider({
//   nodeUrl: "https://starknet-goerli.g.alchemy.com/v2/YOUR_KEY",
// });

// Read-only contract
// export const mediledgerContract = new Contract(abi as any, contractAddress, provider);

// // Writable contract when wallet/account is connected
// export const getWritableContract = (account: Account) => {
//   return new Contract(abi as any, contractAddress, account);
// };

export function useContractFetch(functionName: string, args: any[] = []) {
  const {
    data: readData,
    refetch: dataRefetch,
    isError: readIsError,
    isLoading: readIsLoading,
    error: readError,
  } = useReadContract({
    abi: MEDILEDGER_ABI,
    functionName,
    address: contractAddress,
    args,
    refetchInterval: 5000,
  });

  return { readData, dataRefetch, readIsError, readIsLoading, readError };
}

export function useContractWriteUtility(
  functionName: string,
  args: any[],
  abi: any
) {
  const { contract } = useContract({ abi, address: contractAddress });

  const calls = useMemo(() => {
    if (!contract || !functionName || !args?.length) {
      return undefined; // prevent crashing at render
    }
    try {
      return [contract.populate(functionName, args)];
    } catch (err) {
      console.error("Error populating call:", err);
      return undefined;
    }
  }, [contract, functionName, args]);

  const {
    send: writeAsync,
    data: writeData,
    isPending: writeIsPending,
  } = useSendTransaction({ calls });

  const {
    isLoading: waitIsLoading,
    data: waitData,
    status: waitStatus,
    isError: waitIsError,
    error: waitError,
  } = useTransactionReceipt({
    hash: writeData?.transaction_hash,
    watch: true,
  });

  return {
    writeAsync,
    writeData,
    writeIsPending,
    waitIsLoading,
    waitData,
    waitStatus,
    waitIsError,
    waitError,
  };
}

