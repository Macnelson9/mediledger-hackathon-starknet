"use client";
import { useState, useEffect } from "react";
import PermissionsActiveTab from "@/components/PermissionsActiveTab";
import PermissionsRequestsTab from "@/components/PermissionsRequestsTab";

interface Request {
  patientUuid: string;
  hospitalUuid: string;
  status: "pending" | "approved" | "denied";
  timestamp: number;
}

interface MedLedgerAccount {
  id: string;
  address: string;
  role: "patient" | "hospital";
}

export default function PermissionsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [patientUuid, setPatientUuid] = useState<string | null>(null);

  const handleAccept = (id: number) => {
    const updated: Request[] = requests.map((r) =>
      r.timestamp === id ? { ...r, status: "approved" } : r
    );
    setRequests(updated);

    updated.forEach((r) => {
      localStorage.setItem(
        `hospital_requests_${r.hospitalUuid}`,
        JSON.stringify(updated.filter((x) => x.hospitalUuid === r.hospitalUuid))
      );
    });
  };

  const handleRevoke = (id: number) => {
    const updated: Request[] = requests.map((r) =>
      r.timestamp === id ? { ...r, status: "denied" } : r
    );
    setRequests(updated);

    updated.forEach((r) => {
      localStorage.setItem(
        `hospital_requests_${r.hospitalUuid}`,
        JSON.stringify(updated.filter((x) => x.hospitalUuid === r.hospitalUuid))
      );
    });
  };

  // Load patient’s account + collect requests
  useEffect(() => {
    const account = localStorage.getItem("medledger_account");
    if (account) {
      const parsed: MedLedgerAccount = JSON.parse(account);
      if (parsed.role === "patient") {
        setPatientUuid(parsed.id);

        // Collect all hospital requests from LS
        const hospitalRequests = Object.keys(localStorage)
          .filter((k) => k.startsWith("hospital_requests_"))
          .flatMap((key) => JSON.parse(localStorage.getItem(key) || "[]"));

        // Filter only requests for this patient
        const myRequests = hospitalRequests.filter(
          (req: Request) => req.patientUuid === parsed.id
        );

        setRequests(myRequests);
      }
    }
  }, []);

  const formatDay = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  // Split requests into active + pending
  const activeRequests = requests.filter((r) => r.status === "approved");
  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div>
      <h1 className="font-medium text-4xl leading-none tracking-normal">
        Permissions to my Health Records
      </h1>

      {/* Active Permissions */}
      <div className="flex flex-col items-start justify-between mt-4 mb-8">
        <h3 className="font-semibold text-xl leading-none tracking-normal">
          Active
        </h3>
        <div>
          {activeRequests.length === 0 && (
            <p className="text-gray-500">No active permissions.</p>
          )}
          {activeRequests.map((req) => (
            <PermissionsActiveTab
              key={req.timestamp}
              requestId={req.timestamp}
              name={`Hospital ${req.hospitalUuid}`}
              day={formatDay(req.timestamp)}
              time={formatTime(req.timestamp)}
              onRevoke={handleRevoke}
            />
          ))}
        </div>
      </div>

      {/* Pending Requests */}
      <div className="mb-8">
        <h3 className="font-semibold text-xl leading-none tracking-normal">
          Requests
        </h3>
        <div>
          {pendingRequests.length === 0 && (
            <p className="text-gray-500">No pending requests.</p>
          )}
          {pendingRequests.map((req) => (
            <PermissionsRequestsTab
              key={req.timestamp}
              requestId={req.timestamp}
              name={`Request from Hospital ${req.hospitalUuid}`}
              day={formatDay(req.timestamp)}
              time={formatTime(req.timestamp)}
              onAccept={handleAccept}
              onRevoke={handleRevoke}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
