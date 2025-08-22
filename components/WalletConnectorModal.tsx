"use client";
import { Connector, useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { StarknetkitConnector, useStarknetkitConnectModal } from "starknetkit";

export function WalletConnectorModal() {
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const { starknetkitConnectModal } = useStarknetkitConnectModal({
    connectors: connectors as StarknetkitConnector[],
  });

  async function connectWallet() {
    const { connector } = await starknetkitConnectModal();
    if (!connector) return;
    await connect({ connector: connector as Connector });
  }

  const { address } = useAccount();

  if (!address) {
    return (
      <button
        onClick={connectWallet}
        className="py-3 px-6 text-white text-lg font-medium bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors"
      >
        Connect Wallet
        <span className="absolute top-12 left-8 w-32 h-3 bg-purple-500 rounded-full opacity-100 blur-[60px]" />
      </button>
    );
  }

  return (
    <button
      onClick={() => disconnect()}
      className="py-3 px-6 text-white text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors"
    >
      <div className="flex items-center">
        Conn - {address?.slice(0, 4)}...{address?.slice(-2)}
      </div>
    </button>
  );
}
