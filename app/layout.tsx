import "./globals.css";
import type { Metadata } from "next";
import StarknetProvider  from "@/providers/StarknetProvider";


export const metadata: Metadata = {
  title: "MediLedger",
  description: "A decentralized application for managing medical records",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StarknetProvider>{children}</StarknetProvider>
      </body>
    </html>
  );
}
