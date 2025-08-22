"use client";

import { useEffect, useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { z } from "zod";

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

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

interface PatientRecord {
  id: number; // timestamp
  patientUuid: string;
  hospitalUuid: string;
  title: string;
  fileName: string;
  url: string | null; // Cloudinary secure_url
  timestamp: number;
}

const uuidSchema = z
  .string()
  .regex(/^MED-[0-9A-F]{8}$/, "Invalid Patient UUID format (e.g., MED-7FA34B21)");
const titleSchema = z.object({
  title: z.string().min(3, "Record title must be at least 3 characters."),
});

export default function HospitalDashboardPatients() {
  const [showModal, setShowModal] = useState(false);
  const [patientUuid, setPatientUuid] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hospitalUuid, setHospitalUuid] = useState<string | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeRequest, setActiveRequest] = useState<Request | null>(null);
  const [recordTitle, setRecordTitle] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [recordsPatientId, setRecordsPatientId] = useState<string | null>(null);

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const account = localStorage.getItem("medledger_account");
    if (!account) return;
    const parsed: MedLedgerAccount = JSON.parse(account);
    if (parsed.role !== "hospital") return;

    setHospitalUuid(parsed.id);

    const saved = localStorage.getItem(`hospital_requests_${parsed.id}`);
    setRequests(saved ? JSON.parse(saved) : []);
  }, []);

  useEffect(() => {
    if (hospitalUuid && typeof window !== "undefined") {
      localStorage.setItem(`hospital_requests_${hospitalUuid}`, JSON.stringify(requests));
    }
  }, [requests, hospitalUuid]);

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleSubmit = async () => {
    if (!hospitalUuid) {
      addToast("error", "Hospital not logged in.");
      return;
    }

    const parsed = uuidSchema.safeParse(patientUuid);
    if (!parsed.success) {
      addToast("error", parsed.error.issues[0].message);
      return;
    }

    try {
      const records: MedLedgerAccount[] = JSON.parse(
        localStorage.getItem("medledger_records") || "[]"
      );
      const patientExists = records.some((acc) => acc.id === patientUuid);

      if (!patientExists) {
        addToast("error", "Patient not found in MediLedger.");
        return;
      }

      const newRequest: Request = {
        patientUuid,
        hospitalUuid,
        status: "pending",
        timestamp: Date.now(),
      };

      setRequests((prev) => [newRequest, ...prev]);
      addToast("success", "Request sent successfully!");

      setPatientUuid("");
      setShowModal(false);
    } catch (err) {
      addToast("error", "Error sending request.");
    }
  };

  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString();

  const openUploadForRequest = (req: Request) => {
    setActiveRequest(req);
    setRecordTitle("");
    setFileUrl(null);
    setFileName(null);
    setShowUploadModal(true);
  };

  const saveRecord = (patientUuid: string, record: PatientRecord) => {
    const key = `patient_records_${patientUuid}`;
    const list: PatientRecord[] = JSON.parse(localStorage.getItem(key) || "[]");
    list.unshift(record);
    localStorage.setItem(key, JSON.stringify(list));
  };

  const onUploadSubmit = () => {
    if (!activeRequest) return;
    if (!hospitalUuid) {
      addToast("error", "Hospital not logged in.");
      return;
    }
    if (activeRequest.status !== "approved") {
      addToast("error", "Permission not granted by patient yet.");
      return;
    }
    if (!fileUrl || !fileName) {
      addToast("error", "Please upload a file before saving.");
      return;
    }

    const parsed = titleSchema.safeParse({ title: recordTitle });
    if (!parsed.success) {
      addToast("error", parsed.error.issues[0].message);
      return;
    }

    const rec: PatientRecord = {
      id: Date.now(),
      patientUuid: activeRequest.patientUuid,
      hospitalUuid,
      title: recordTitle.trim(),
      fileName,
      url: fileUrl, // Clodinary secure url
      timestamp: Date.now(),
    };

    saveRecord(activeRequest.patientUuid, rec);
    addToast("success", "Record saved with Cloudinary URL.");
    setShowUploadModal(false);
    setActiveRequest(null);
  };

  const openRecordsModal = (patientUuid: string) => {
    const key = `patient_records_${patientUuid}`;
    const list: PatientRecord[] = JSON.parse(localStorage.getItem(key) || "[]");
    setRecords(list);
    setRecordsPatientId(patientUuid);
    setShowRecordsModal(true);
  };

  return (
    <div className="relative">
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded shadow text-white ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
      <h1 className="font-medium text-5xl leading-none tracking-normal">Patients</h1>
      <div className="mt-8">
        <button
          className="text-xl flex justify-start bg-blue-400 text-white font-medium px-4 py-3 rounded-lg cursor-pointer transition-colors ease-in-out hover:bg-blue-500"
          onClick={() => setShowModal(true)}
        >
          Add New Patients
        </button>
      </div>
      <div className="flex flex-col mt-8">
        <h3 className="text-3xl font-semibold mb-4">Recent Activities</h3>
        <div className="space-y-3">
          {requests.length === 0 && <p className="text-gray-500">No requests yet.</p>}
          {requests.map((req) => (
            <div
              key={req.timestamp}
              className="w-full p-4 rounded-xl shadow bg-white border border-gray-200 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">Patient UUID: {req.patientUuid}</p>
                  <p className="text-sm text-gray-500">Sent: {formatDate(req.timestamp)}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    req.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : req.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {req.status}
                </span>
              </div>

              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => openUploadForRequest(req)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Upload Record
                </button>
                <button
                  onClick={() => openRecordsModal(req.patientUuid)}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  View Records
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-40 grid place-items-center backdrop-blur-sm bg-slate-900/20">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold">Request Patient Permission</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1.5 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">Patient UUID</label>
              <input
                type="text"
                placeholder="e.g., MED-7FA34B21"
                value={patientUuid}
                onChange={(e) => setPatientUuid(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
      {showUploadModal && activeRequest && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div
            className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-slate-900/30 to-slate-900/20 backdrop-blur-sm"
            onClick={() => {
              setShowUploadModal(false);
              setActiveRequest(null);
            }}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Upload Patient Record</h3>
                <p className="text-xs text-slate-500">
                  Patient: <span className="font-mono">{activeRequest.patientUuid}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setActiveRequest(null);
                }}
                className="rounded-full p-1.5 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {activeRequest.status !== "approved" && (
              <div className="mx-6 mt-4 mb-0 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
                This hospital has not been approved by the patient yet. You cannot upload a record
                until the request is <b>approved</b>.
              </div>
            )}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Record Title</label>
                <input
                  type="text"
                  value={recordTitle}
                  onChange={(e) => setRecordTitle(e.target.value)}
                  placeholder="e.g., CT Scan Report"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Upload File</label>

                {!uploadPreset ? (
                  <p className="mt-1 text-sm text-red-600">
                    Missing <code>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code> in <code>.env.local</code>
                  </p>
                ) : (
                  <CldUploadWidget
                    uploadPreset={uploadPreset}
                    options={{
                      multiple: false,
                      maxFiles: 1,
                      resourceType: "auto",
                      clientAllowedFormats: [
                        "pdf",
                        "jpg",
                        "jpeg",
                        "png",
                        "webp",
                        "heic",
                        "doc",
                        "docx",
                      ],
                      maxFileSize: 25_000_000,
                    }}
                    onSuccess={(result: unknown) => {
                      const info = (result as any)?.info as
                        | { secure_url?: string; original_filename?: string }
                        | undefined;

                      if (info?.secure_url) {
                        setFileUrl(info.secure_url);
                        setFileName(info.original_filename || "unnamed");
                        addToast("success", "✅ File uploaded to Cloudinary!");
                      } else {
                        addToast(
                          "error",
                          "Upload finished but URL missing. Check upload preset & formats."
                        );
                      }
                    }}
                    onError={(err: unknown) => {
                      const message =
                        (typeof err === "object" &&
                          err &&
                          "message" in (err as any) &&
                          (err as any).message) ||
                        "Upload failed. Check your unsigned preset, allowed formats, and file size.";
                      addToast("error", `❌ ${message}`);
                    }}
                    onClose={() => {
                      if (!fileUrl) {
                        addToast("error", "Upload canceled.");
                      }
                    }}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="mt-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        disabled={activeRequest.status !== "approved"}
                      >
                        {fileName ? `Uploaded: ${fileName}` : "Upload to Cloudinary"}
                      </button>
                    )}
                  </CldUploadWidget>
                )}

                {!!fileUrl && (
                  <p className="mt-2 text-xs text-slate-500 break-all">
                    Saved URL: <span className="font-mono">{fileUrl}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 pb-5">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setActiveRequest(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={onUploadSubmit}
                disabled={activeRequest.status !== "approved"}
                className={`px-4 py-2 rounded-lg text-white ${
                  activeRequest.status === "approved"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-slate-400 cursor-not-allowed"
                }`}
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
      {showRecordsModal && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowRecordsModal(false)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Records for Patient {recordsPatientId}
              </h3>
              <button
                onClick={() => setShowRecordsModal(false)}
                className="rounded-full p-1.5 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            {records.length === 0 ? (
              <p className="text-gray-500">No records uploaded yet.</p>
            ) : (
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {records.map((rec) => (
                  <li
                    key={rec.id}
                    className="p-4 border border-gray-200 rounded-lg bg-slate-50"
                  >
                    <p className="font-medium">{rec.title}</p>
                    <p className="text-sm text-gray-600">{rec.fileName}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded: {formatDate(rec.timestamp)}
                    </p>
                    {rec.url && (
                      <a
                        href={rec.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-blue-600 hover:underline text-sm"
                      >
                        View File
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
