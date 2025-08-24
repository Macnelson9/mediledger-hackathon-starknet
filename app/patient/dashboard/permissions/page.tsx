"use client";
import { useState, useEffect, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { deriveUUID, fromFeltUUID } from "@/utils/starkEncoding";
import PermissionsActiveTab from "@/components/PermissionsActiveTab";
import PermissionsRequestsTab from "@/components/PermissionsRequestsTab";
import { usePatientAccessRequests } from "@/hooks/usePatientAccessRequest";
import { toFeltUUID } from "@/utils/starkEncoding";
import { num } from "starknet";
import { useContractWriteUtility } from "@/lib/starknet";
import { MEDILEDGER_ABI } from "@/abi/Mediledger";

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

// Minimal local shape for AccessRequested events returned from the RPC
type AccessEventLocal = {
  patientId?: string | number;
  hospitalId?: string | number;
  timestamp?: string | number;
};

export default function PermissionsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const { data: events } = usePatientAccessRequests();
  const { address } = useAccount();

  // Helper: robustly normalize an address-like value to a lowercase 0x-prefixed hex string
  const normalizeAddress = (a?: string | null) => {
    if (!a) return null;
    try {
      // BigInt handles "0x..." and decimal strings; output canonical hex (no leading zeros)
      const asHex = "0x" + BigInt(a).toString(16);
      return asHex.toLowerCase();
    } catch {
      // fallback: ensure 0x prefix and lowercase
      const s = String(a).trim();
      return s.startsWith("0x") ? s.toLowerCase() : "0x" + s.toLowerCase();
    }
  };

  const handleAccept = (id: number) => {
    // ensure connected wallet matches registered patient address
    try {
      const acct = localStorage.getItem("medledger_account");
      console.log(`acct: ${acct}`);
      if (acct && address) {
        const parsed = JSON.parse(acct) as MedLedgerAccount;
        const connected = normalizeAddress(address);
        const storedRaw = parsed.address || parsed.id || "";
        const stored =
          normalizeAddress(storedRaw) || String(storedRaw).toLowerCase();

        console.log(stored, connected);
        // direct match
        if (stored === connected) {
          /* ok */
        } else {
          // try readable derived id and its felt from connected wallet
          try {
            const readable = deriveUUID(address, "patient");
            const readableLower = readable.toLowerCase();
            const felt = toFeltUUID(readable).toLowerCase();
            const felt2 = fromFeltUUID(address);

            console.log(
              `readable: ${readable}, readableLower: ${readableLower}, felt: ${felt}, felt2: ${felt2}`
            );
            if (
              stored === readableLower ||
              stored === felt ||
              stored === String(readable).toLowerCase()
            ) {
              // ok
            } else {
              alert(
                "Connect the wallet that owns this patient account to approve access."
              );
              return;
            }
          } catch {
            alert(
              "Connect the wallet that owns this patient account to approve access."
            );
            return;
          }
        }
      }
    } catch (e) {
      console.debug("permissions: address-guard parse error:", e);
      /* ignore */
    }

    // trigger on-chain grant and update UI on success
    setActionType("grant");
    setActionHospital(
      String(requests.find((r) => r.timestamp === id)?.hospitalUuid || "")
    );
  };

  const handleRevoke = (id: number) => {
    // ensure connected wallet matches registered patient address
    try {
      const acct = localStorage.getItem("medledger_account");
      if (acct) {
        const parsed = JSON.parse(acct) as MedLedgerAccount;
        if (parsed.address && address) {
          const stored = normalizeAddress(parsed.address);
          const connected = normalizeAddress(address);
          console.debug(
            "permissions: stored address:",
            stored,
            "connected:",
            connected
          );
          if (stored !== connected) {
            alert(
              "Connect the wallet that owns this patient account to revoke access."
            );
            return;
          }
        }
      }
    } catch (e) {
      console.debug("permissions: address-guard parse error:", e);
      /* ignore */
    }

    // trigger on-chain revoke and update UI on success
    setActionType("revoke");
    setActionHospital(
      String(requests.find((r) => r.timestamp === id)?.hospitalUuid || "")
    );
  };

  // Action state for on-chain calls
  const [actionHospital, setActionHospital] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"grant" | "revoke" | null>(null);

  // derive patient id from localStorage medledger_account or wallet address
  const patientIdString = (() => {
    try {
      const acct = localStorage.getItem("medledger_account");
      if (acct) {
        const parsed = JSON.parse(acct) as MedLedgerAccount;
        if (parsed?.id) return parsed.id;
      }
    } catch {
      /* ignore */
    }
    // fallback: derive from connected address
    if (address) return deriveUUID(address, "patient");
    return null;
  })();

  const patientFeltForHook = useMemo(() => {
    if (!patientIdString) return "0x0";
    return patientIdString.startsWith("0x")
      ? patientIdString
      : toFeltUUID(patientIdString);
  }, [patientIdString]);

  const hospitalFeltForHook = useMemo(() => {
    if (!actionHospital) return "0x0";
    return actionHospital.startsWith("0x")
      ? actionHospital
      : toFeltUUID(actionHospital);
  }, [actionHospital]);

  // create write hooks (kept at top-level): args will update when actionHospital/patientFelt change
  const { writeAsync: grantWrite } = useContractWriteUtility(
    "grant_access",
    [hospitalFeltForHook || "0x0", patientFeltForHook || "0x0"],
    MEDILEDGER_ABI
  );

  const { writeAsync: revokeWrite } = useContractWriteUtility(
    "revoke_access",
    [hospitalFeltForHook || "0x0", patientFeltForHook || "0x0"],
    MEDILEDGER_ABI
  );

  // perform on-chain write when actionType/actionHospital are set
  useEffect(() => {
    if (!actionType || !actionHospital) return;

    const run = async () => {
      try {
        if (actionType === "grant") {
          if (!grantWrite) throw new Error("Grant write not ready");
          await grantWrite();
          setRequests((prev) =>
            prev.map((r) =>
              r.hospitalUuid === actionHospital
                ? { ...r, status: "approved" }
                : r
            )
          );
        } else if (actionType === "revoke") {
          if (!revokeWrite) throw new Error("Revoke write not ready");
          await revokeWrite();
          setRequests((prev) =>
            prev.map((r) =>
              r.hospitalUuid === actionHospital ? { ...r, status: "denied" } : r
            )
          );
        }
      } catch (err) {
        console.error("On-chain action failed:", err);
      } finally {
        setActionType(null);
        setActionHospital(null);
      }
    };

    run();
  }, [actionType, actionHospital, grantWrite, revokeWrite]);

  useEffect(() => {
    const account = localStorage.getItem("medledger_account");
    const parsed: MedLedgerAccount | null = account
      ? JSON.parse(account)
      : null;

    // If no on-disk medledger_account, fall back to connected wallet address
    if (!parsed && !address) return;
    if (!events) return;

    console.debug(
      "permissions effect: parsed account:",
      parsed,
      "address:",
      address
    );

    // Build candidate patient id forms to compare against event.patientId
    const candidates = new Set<string>();
    if (parsed) candidates.add(String(parsed.id).toLowerCase());
    if (address) {
      try {
        const readable = deriveUUID(address, "patient");
        candidates.add(String(readable).toLowerCase());
        const felt = String(toFeltUUID(readable)).toLowerCase();
        candidates.add(felt);
      } catch {
        // ignore derive errors
      }
    }

    const matchesPatient = (evPatientId: string | undefined) => {
      if (!evPatientId) return false;
      const ev = String(evPatientId).toLowerCase();
      // quick direct match
      if (candidates.has(ev)) return true;

      // compare against each candidate as substring or equality
      for (const cand of candidates) {
        if (!cand) continue;
        if (ev === cand) return true;
        if (ev.includes(cand) || cand.includes(ev)) return true;
      }

      // If event has a hex felt like 0x..., compare to toFeltUUID(pid)
      // If event has a hex felt like 0x..., compare to candidate felts
      if (ev.startsWith("0x")) {
        for (const cand of candidates) {
          try {
            const candFelt = String(toFeltUUID(cand)).toLowerCase();
            if (ev === candFelt) return true;
          } catch {
            // ignore
          }
        }
      }
      return false;
    };

    console.debug("permissions effect: candidates:", Array.from(candidates));
    console.debug(
      "permissions effect: events length:",
      (events as AccessEventLocal[]).length
    );

    const mapped: Request[] = (events as AccessEventLocal[])
      .filter((ev) => matchesPatient(String(ev.patientId)))
      .map((ev) => ({
        patientUuid: String(ev.patientId),
        hospitalUuid: String(ev.hospitalId),
        status: "pending" as const,
        timestamp: Number(ev.timestamp) || Date.now(),
      }));

    console.log("🔎 Final mapped requests:", mapped);
    setRequests(mapped);
  }, [events, address]);

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

  const isPrintable = (s: string) => {
    if (!s) return false;
    const printable = s.split("").filter((c) => {
      const code = c.charCodeAt(0);
      return code >= 32 && code <= 126;
    }).length;
    return printable / s.length > 0.6;
  };

  const formatHospitalLabel = (hospitalId: string) => {
    if (!hospitalId) return "Hospital";
    const id = String(hospitalId);
    // if it looks like hex felt, try to decode to utf8
    if (id.startsWith("0x")) {
      try {
        const bytes = num.hexToBytes(id);
        const s = Buffer.from(bytes).toString("utf8");
        if (isPrintable(s)) return s;
      } catch {
        // ignore
      }
      // fallback: show short hex
      return `Hospital ${id.slice(0, 10)}...`;
    }

    // otherwise show as-is (maybe readable id like HOSP-...)
    return `Hospital ${id}`;
  };

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
              name={formatHospitalLabel(req.hospitalUuid)}
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
              name={`Request from ${formatHospitalLabel(req.hospitalUuid)}`}
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
