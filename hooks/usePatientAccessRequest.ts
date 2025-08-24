// hooks/usePatientAccessRequest.ts
"use client";

import { useEffect, useState } from "react";
import { useAllContractEvents } from "./useAllContractEvents";

interface AccessRequestEvent {
  hospitalId: string;
  patientId: string;
  timestamp: number;
}

export function usePatientAccessRequests() {
  const { events, isLoading, error } = useAllContractEvents();
  const [data, setData] = useState<AccessRequestEvent[]>([]);

  useEffect(() => {
    if (!events?.pages) return;

    try {
      // Flatten the pages into one array
      type EventPage = { events?: unknown[] };
      type EventShape = {
        keys?: string[];
        data?: unknown[];
        block_number?: number;
      };

      const flatEvents = events.pages.flatMap((p: EventPage) => p.events || []);

      const decoded: AccessRequestEvent[] = (flatEvents as EventShape[]).map(
        (ev) => {
          // event shape: ev.keys includes selector and keyed fields; ev.data includes data fields
          // Per ABI: AccessRequested has hospital_id as a key, and patient_id + timestamp as data
          const hospitalId =
            ev.keys && ev.keys.length > 1 ? ev.keys[1] : undefined;
          const patientId =
            ev.data && ev.data.length > 0 ? ev.data[0] : undefined;
          const tsData = ev.data && ev.data.length > 1 ? ev.data[1] : undefined;

          // Normalize timestamp to milliseconds when possible
          let timestampMs: number;
          if (tsData != null) {
            // tsData may be a numeric string or hex; attempt to parse
            const asNum = Number(tsData);
            timestampMs = Number.isFinite(asNum) ? asNum * 1000 : Date.now();
          } else if (ev.block_number) {
            timestampMs = Number(ev.block_number) * 1000;
          } else {
            timestampMs = Date.now();
          }

          return {
            patientId: String(patientId ?? ""),
            hospitalId: String(hospitalId ?? ""),
            timestamp: timestampMs,
          } as AccessRequestEvent;
        }
      );

      console.log("✅ Decoded AccessRequested events:", decoded);
      setData(decoded);
    } catch (err) {
      console.error("❌ Error decoding events:", err);
    }
  }, [events]);

  return { data, loading: isLoading, error };
}
