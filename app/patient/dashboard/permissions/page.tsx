"use client";
import { useState, useEffect } from "react";
import { useProvider } from "@starknet-react/core";
import { num } from "starknet";
import PermissionsActiveTab from "@/components/PermissionsActiveTab";
import PermissionsRequestsTab from "@/components/PermissionsRequestsTab";

const contractAddress = "0x007048183ef958ea028cc7739ef23d97922802459d3e09ee3801bb3d2467f544";

interface Request {
  patientUuid: string;
  hospitalUuid: string;
  status: "pending" | "approved" | "denied";
  timestamp: number;
  blockNumber?: number;
  transactionHash?: string;
}

interface MedLedgerAccount {
  id: string;
  address: string;
  role: "patient" | "hospital";
}

export default function PermissionsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [patientUuid, setPatientUuid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { provider } = useProvider();

  // Function to refresh requests data (can be called by child components after successful transactions)
  const refreshRequests = () => {
    if (patientUuid) {
      fetchAccessRequests(patientUuid);
    }
  };

  // Function to fetch events from the blockchain
  const fetchAccessRequests = async (patientId: string) => {
    if (!provider) {
      console.error("Provider not available - falling back to localStorage");
      loadFromLocalStorage(patientId);
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching requests for patient:", patientId);
      
      // Convert patient ID to felt252 for filtering
      const patientIdFelt = num.toFelt(patientId);
      console.log("Patient ID as felt:", patientIdFelt);

      // Get recent blocks to search (adjust based on your needs)
      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 50000); // Increased search range
      console.log("Searching blocks from", fromBlock, "to", latestBlock);

      // Fetch all events from the contract
      const allEvents = await provider.getEvents({
        address: contractAddress,
        from_block: { block_number: fromBlock },
        to_block: "latest",
        keys: [],
        chunk_size: 1000,
      });

      console.log("Total events found:", allEvents.events.length);

      // Process events to build requests with their current status
      const requestsMap = new Map<string, Request>();

      allEvents.events.forEach((event, index) => {
        try {
          console.log(`Event ${index}:`, {
            keys: event.keys,
            data: event.data,
            block_number: event.block_number
          });

          // Look for AccessRequested events specifically
          // According to your ABI: AccessRequested has hospital_id as key, patient_id and timestamp as data
          if (event.keys.length > 0 && event.data.length >= 2) {
            const eventPatientId = event.data[0]; // patient_id is in data[0]
            const eventTimestamp = event.data[1]; // timestamp is in data[1]  
            const eventHospitalId = event.keys[1] || event.keys[0]; // hospital_id should be in keys[1]

            console.log("Processing event:", {
              eventPatientId,
              patientIdFelt,
              eventTimestamp,
              eventHospitalId,
              matches: eventPatientId === patientIdFelt
            });

            // Only process events for this patient
            if (eventPatientId === patientIdFelt) {
              const key = `${eventHospitalId}-${eventPatientId}`;
              const timestamp = parseInt(eventTimestamp, 16) * 1000;

              console.log("Adding request for patient:", key);

              requestsMap.set(key, {
                patientUuid: patientId,
                hospitalUuid: eventHospitalId,
                status: "pending",
                timestamp,
                blockNumber: event.block_number,
                transactionHash: event.transaction_hash,
              });
            }
          }
        } catch (err) {
          console.error("Error processing event:", err, event);
        }
      });

      const requestsArray = Array.from(requestsMap.values())
        .sort((a, b) => b.timestamp - a.timestamp);

      console.log("Final requests array:", requestsArray);
      setRequests(requestsArray);

      // If no blockchain data found, fall back to localStorage
      if (requestsArray.length === 0) {
        console.log("No blockchain requests found, falling back to localStorage");
        loadFromLocalStorage(patientId);
      }
    } catch (error) {
      console.error("Error fetching access requests:", error);
      // Fallback to localStorage for development/testing
      loadFromLocalStorage(patientId);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine event status (you may need to refine this)
  const determineEventStatus = (event: any): "approved" | "denied" | null => {
    // This is a simplified approach - you might want to check event signatures
    // or other properties to determine if it's AccessGranted vs AccessRevoked
    
    // For now, return null to keep existing status
    // You can implement proper event type detection here
    return null;
  };

  // Fallback function to load from localStorage (for development)
  const loadFromLocalStorage = (patientId: string) => {
    try {
      const hospitalRequests = Object.keys(localStorage)
        .filter((k) => k.startsWith("hospital_requests_"))
        .flatMap((key) => {
          const data = localStorage.getItem(key);
          return data ? JSON.parse(data) : [];
        });

      const myRequests = hospitalRequests.filter(
        (req: Request) => req.patientUuid === patientId
      );

      setRequests(myRequests);
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      setRequests([]);
    }
  };

  // Load patient's account and fetch requests
  useEffect(() => {
    const account = localStorage.getItem("medledger_account");
    if (account) {
      try {
        const parsed: MedLedgerAccount = JSON.parse(account);
        if (parsed.role === "patient") {
          setPatientUuid(parsed.id);
          fetchAccessRequests(parsed.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error parsing account data:", error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [provider]);

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

  if (loading) {
    return (
      <div>
        <h1 className="font-medium text-4xl leading-none tracking-normal">
          Permissions to my Health Records
        </h1>
        <p className="mt-4 text-gray-600">Loading requests from blockchain...</p>
      </div>
    );
  }

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
              key={`${req.hospitalUuid}-${req.timestamp}`}
              requestId={req.timestamp}
              hospitalUuid={req.hospitalUuid}
              patientUuid={req.patientUuid}
              name={`Hospital ${req.hospitalUuid.slice(0, 8)}...`}
              day={formatDay(req.timestamp)}
              time={formatTime(req.timestamp)}
              onSuccess={refreshRequests} // Callback to refresh data after successful action
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
              key={`${req.hospitalUuid}-${req.timestamp}`}
              requestId={req.timestamp}
              hospitalUuid={req.hospitalUuid}
              patientUuid={req.patientUuid}
              name={`Request from Hospital ${req.hospitalUuid.slice(0, 8)}...`}
              day={formatDay(req.timestamp)}
              time={formatTime(req.timestamp)}
              onSuccess={refreshRequests} // Callback to refresh data after successful action
            />
          ))}
        </div>
      </div>

      {/* Debug info and refresh button for development */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h4 className="font-medium mb-2">Debug Info:</h4>
        <p className="text-sm">Patient UUID: {patientUuid || "Not loaded"}</p>
        <p className="text-sm">Provider Connected: {provider ? "Yes" : "No"}</p>
        <p className="text-sm">Total Requests: {requests.length}</p>
        <button
          onClick={refreshRequests}
          className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh from Blockchain"}
        </button>
        <button
          onClick={() => patientUuid && loadFromLocalStorage(patientUuid)}
          className="mt-2 ml-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
        >
          Load from localStorage
        </button>
      </div>
    </div>
  );
}