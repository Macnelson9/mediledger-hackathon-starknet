"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface MedLedgerAccount {
  address: string;
  role: "patient" | "hospital";
  id: string;
}

export function HospitalNav() {
  const [user, setUser] = useState<MedLedgerAccount | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem("medledger_account");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const links = [
    { href: "/hospital/dashboard", label: "Dashboard" },
    { href: "/hospital/dashboard/patients", label: "Patients" },
    { href: "/hospital/dashboard/records", label: "Records" },
  ];

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <nav className="bg-blue-200/50 flex flex-col items-center w-[20vw] h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-800">MediLedger</h1>
        <p>{user.id}</p>
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
