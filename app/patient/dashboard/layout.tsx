"use client";
import { useDisconnect, useAccount } from "@starknet-react/core";
import { PatientNav } from "@/components/PatientNav";
import { useRouter } from "next/navigation";

export default function PatientDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { disconnect } = useDisconnect();
  const { address } = useAccount();
  const route = useRouter();
  return (
    <section className="flex flex-row w-screen h-screen">
      <PatientNav />
      <section className="w-[80vw] h-screen flex flex-col bg-blue-300/10 overflow-y-auto px-7">
        <div className="flex justify-end w-full p-4">
          <button className="border-1 border-blue-400 font-bold text-blue-400 px-4 py-3 rounded-lg transition-colors ease-in-out hover:bg-blue-300 hover:text-white" onClick={() => {
            disconnect();
            route.push("/");
          }}>
            Disconnect {address?.slice(0, 4)}...{address?.slice(-2)}
          </button>
        </div>
        {children}
      </section>
    </section>
  );
}
