"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { deriveUUID, fromFeltUUID, toFeltUUID } from "@/utils/starkEncoding";
import Image from "next/image";

interface MedLedgerAccount {
  address: string;
  role: "patient" | "hospital";
  id: string;
}

export function HospitalNav() {
  // const [user, setUser] = useState<MedLedgerAccount | null>(null);
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();
  const { address } = useAccount();

  // useEffect(() => {
  //   const storedUser = localStorage.getItem("medledger_account");
  //   if (storedUser) {
  //     setUser(JSON.parse(storedUser));
  //   }
  // }, []);

  const links = [
    { href: "/hospital/dashboard", label: "Dashboard" },
    { href: "/hospital/dashboard/patients", label: "Patients" },
  ];

  const handleCopyUUID = async () => {
    if (address) {
      const uuid = toFeltUUID(address);
      try {
        await navigator.clipboard.writeText(uuid);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy UUID:", err);
      }
    }
  };

  // if (!user) {
  //   return <p>Loading...</p>;
  // }

  const hospitalUUID = address
    ? toFeltUUID(deriveUUID(address, "hospital"))
    : null;

  return (
    <nav className="bg-blue-200/50 flex flex-col items-center w-[20vw] h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 w-full">
        <Image
          src="/logo-removebg-preview.png"
          alt="logo"
          width={200}
          height={200}
          className="mx-auto"
        />
        {/* <h1 className="text-3xl font-bold text-gray-800 mb-4">MediLedger</h1> */}
        {/* <p className="text-sm text-gray-600 mb-4">{user.id}</p> */}

        {/* Hospital UUID Section */}
        {hospitalUUID && (
          <div className="mb-6 p-3 bg-white/70 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 mb-2 font-medium">
              Hospital UUID
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded flex-1 break-all">
                {hospitalUUID}
              </code>
              <button
                onClick={handleCopyUUID}
                className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                title="Copy UUID to clipboard"
              >
                {copied ? "✓" : "Copy"}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-1 text-center">Copied!</p>
            )}
          </div>
        )}

        <div>
          <ul className="mt-4 space-y-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li
                  key={link.href}
                  className={`border-b border-black w-full transition-colors ease-in-out ${
                    isActive
                      ? "text-blue-500 border-blue-500 font-semibold"
                      : "text-black hover:text-blue-500 hover:border-blue-500"
                  }`}
                >
                  <Link
                    href={link.href}
                    className="py-3 transition-colors ease-in-out text-xl block"
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
