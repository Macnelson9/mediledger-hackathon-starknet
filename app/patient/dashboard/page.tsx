"use client";
import { useEffect, useState } from "react";
import PatientDashboardCard from "@/components/PatientDashboardCard";

/* ---------- Types ---------- */
interface PatientRecord {
  id: number;
  patientUuid: string;
  hospitalUuid: string;
  title: string;
  fileName: string;
  url: string | null;
  timestamp: number;
}

interface MedLedgerAccount {
  id: string;
  address: string;
  role: "patient" | "hospital";
}

export default function PatientDashboardPage() {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [patientUuid, setPatientUuid] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Get logged in account
    const account = localStorage.getItem("medledger_account");
    if (!account) return;

    const parsed: MedLedgerAccount = JSON.parse(account);
    if (parsed.role !== "patient") return;

    setPatientUuid(parsed.id);

    // Load patient’s medical history
    const saved = localStorage.getItem(`patient_records_${parsed.id}`);
    setRecords(saved ? JSON.parse(saved) : []);
  }, []);

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleString();

  return (
    <div>
      <h1 className="font-bold text-5xl leading-none tracking-normal">
        My Health Overview
      </h1>

      {/* Dashboard stats */}
      <div className="flex flex-wrap gap-4 mt-8">
        <PatientDashboardCard name="Hospital Visits" num="12" />
        <PatientDashboardCard name="Unique Hospitals" num="4" />
        <PatientDashboardCard name="Shared Access" num="6" />
      </div>

      {/* Medical History */}
      <div className="mt-12">
        <h3 className="text-4xl font-medium mb-4">My Medical History</h3>

        {records.length === 0 ? (
          <p className="text-gray-500">No medical records yet.</p>
        ) : (
          <div className="space-y-3">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl shadow bg-white border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{rec.title}</p>
                    <p className="text-sm text-gray-500">
                      Uploaded by: {rec.hospitalUuid}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(rec.timestamp)}
                    </p>
                  </div>
                  {rec.url && (
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View File
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
