"use client";

import { useRouter } from "next/navigation";
import { WalletConnectorModal } from "@/components/WalletConnectorModal";
import { useAccount } from "@starknet-react/core";
import { useState } from "react";
import { contractAddress, MEDILEDGER_ABI } from "@/abi/Mediledger";
import { useContractFetch } from "@/lib/starknet";
import { toFeltUUID, deriveUUID } from "@/utils/starkEncoding";
import { byteArray, CallData } from "starknet";
import Image from "next/image";

type Role = "patient" | "hospital";

export default function Home() {
  const router = useRouter();
  const { address, account } = useAccount();

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Call verify functions
  const { readData: isPatient } = useContractFetch("verify_patient", [
    address ? toFeltUUID(deriveUUID(address, "patient")) : "0x0",
  ]);

  const { readData: isHospital } = useContractFetch("verify_hospital", [
    address ? toFeltUUID(deriveUUID(address, "hospital")) : "0x0",
  ]);

  const handleRoleSelect = async (selectedRole: Role) => {
    if (!address || !account) {
      console.log(
        "No address or account found, cannot proceed with registration"
      );
      return;
    }

    if (!name.trim()) {
      alert("Please enter your name before continuing.");
      return;
    }

    console.log("Starting registration process...");
    console.log("Role:", selectedRole);
    console.log("Name:", name);
    console.log("Address:", address);

    setIsRegistering(true);

    try {
      const functionName =
        selectedRole === "patient" ? "register_patient" : "register_hospital";

      console.log(`Attempting to register as ${selectedRole}...`);
      console.log("Function name:", functionName);
      console.log("UUID: ", toFeltUUID(deriveUUID(address, selectedRole)));

      const result = await account.execute({
        contractAddress: contractAddress,
        entrypoint: functionName,
        calldata: CallData.compile({
          name: byteArray.byteArrayFromString(name),
          uuid: toFeltUUID(deriveUUID(address, selectedRole)),
        }),
      });

      console.log("Registration result:", result);
      console.log("Transaction hash:", result.transaction_hash);

      if (result.transaction_hash) {
        console.log(`
          ${selectedRole} registration successful! Transaction hash:,
          result.transaction_hash`);
        console.log(`Redirecting to ${selectedRole} dashboard...`);

        if (selectedRole === "patient") {
          router.push("/patient/dashboard");
        } else {
          router.push("/hospital/dashboard");
        }
      } else {
        console.log(`
          ${selectedRole} registration failed - no transaction hash returned`);
        alert("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  if (isPatient) {
    router.push("/patient/dashboard");
  }

  if (isHospital) {
    router.push("/hospital/dashboard");
  }

  return (
    <section className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="bg-white shadow-lg rounded-2xl p-10 max-w-xl w-full text-center">
         <Image
          src="/logo-removebg-preview.png"
          alt="logo"
          width={200}
          height={200}
          className="mx-auto"
        />
        <h1 className="text-gray-900 font-bold text-4xl mb-3">
          Welcome to MediLedger
        </h1>
        <p className="text-gray-600 text-lg mb-8">
          Your #1 Decentralized Health Record Keeper
        </p>

        <WalletConnectorModal />

        {address && !isPatient && !isHospital && (
          <button
            onClick={() => setShowRoleModal(true)}
            className="mt-6 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
          >
            Complete Registration
          </button>
        )}

        {showRoleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
            <div className="bg-white p-8 rounded-xl shadow-lg w-96 text-left">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Complete Your Registration
              </h2>

              <label className="block text-gray-700 text-sm font-medium mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-400 mb-4"
              />

              <h3 className="text-gray-700 font-medium mb-2">
                Select Your Role
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => handleRoleSelect("patient")}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  disabled={isRegistering}
                >
                  {isRegistering ? "Registering..." : "I am a Patient"}
                </button>
                <button
                  onClick={() => handleRoleSelect("hospital")}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                  disabled={isRegistering}
                >
                  {isRegistering ? "Registering..." : "I am a Hospital"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
