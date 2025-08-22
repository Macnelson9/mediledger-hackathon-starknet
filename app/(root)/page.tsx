  "use client";

  import { useRouter } from "next/navigation";
  import { WalletConnectorModal } from "@/components/WalletConnectorModal";
  import { useAccount } from "@starknet-react/core";
  import { useState, useEffect } from "react";
  import { MEDILEDGER_ABI } from "@/abi/Mediledger";
  import { useContractFetch, useContractWriteUtility } from "@/lib/starknet";
  import { deriveUUID } from "@/utils/starkEncoding";
  import { shortString, hash } from "starknet";

  type Role = "patient" | "hospital";

  export default function Home() {
    const router = useRouter();
    const { address } = useAccount();

    const [showRoleModal, setShowRoleModal] = useState(false);
    const [name, setName] = useState("");

    // derive UUIDs (always same for address + role)
    const patientUUID = address ? deriveUUID(address, "patient") : "0x0";
    const hospitalUUID = address ? deriveUUID(address, "hospital") : "0x0";

    // verify returning user from contract
    const { readData: isPatient } = useContractFetch("verify_patient", [
      patientUUID,
    ]);
    const { readData: isHospital } = useContractFetch("verify_hospital", [
      hospitalUUID,
    ]);

    // write hooks for register
    const patientRegister = useContractWriteUtility(
      "register_patient",
      address ? [shortString.encodeShortString(name), patientUUID] : [],
      MEDILEDGER_ABI
    );

    const hospitalRegister = useContractWriteUtility(
      "register_hospital",
      address ? [shortString.encodeShortString(name), hospitalUUID] : [],
      MEDILEDGER_ABI
    );

    useEffect(() => {
      if (!address) return;
      if (isPatient) router.push("/patient/dashboard");
      else if (isHospital) router.push("/hospital/dashboard");
      else setShowRoleModal(true);
    }, [address, isPatient, isHospital, router]);

    const handleRoleSelect = async (selectedRole: Role) => {
      if (!address) return;
      if (!name.trim()) {
        alert("Please enter your name before continuing.");
        return;
      }

      try {
        if (selectedRole === "patient") {
          const tx = (await patientRegister.writeAsync?.()) as
            | { transaction_hash: string }
            | undefined;
          if (tx?.transaction_hash) {
            router.push("/patient/dashboard");
          }
        } else {
          const tx = (await hospitalRegister.writeAsync?.()) as
            | { transaction_hash: string }
            | undefined;
          if (tx?.transaction_hash) {
            router.push("/hospital/dashboard");
          }
        }
      } catch (err) {
        console.error("Transaction failed:", err);
      }
    };

    return (
      <section className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-100 to-purple-200">
        <div className="bg-white shadow-lg rounded-2xl p-10 max-w-xl w-full text-center">
          <h1 className="text-gray-900 font-bold text-4xl mb-3">
            Welcome to MediLedger
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Your #1 Decentralized Health Record Keeper
          </p>

          <WalletConnectorModal />

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
                    disabled={patientRegister.writeIsPending}
                  >
                    {patientRegister.writeIsPending
                      ? "Registering..."
                      : "I am a Patient"}
                  </button>
                  <button
                    onClick={() => handleRoleSelect("hospital")}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    disabled={hospitalRegister.writeIsPending}
                  >
                    {hospitalRegister.writeIsPending
                      ? "Registering..."
                      : "I am a Hospital"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }
