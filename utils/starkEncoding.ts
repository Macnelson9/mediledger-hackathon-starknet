import { shortString, hash } from "starknet";

/**
 * Convert a human-readable UUID like "MED-7FA34B21" or "HOSP-1234ABCD"
 * into a felt (hex string).
 */
export const toFeltUUID = (id: string): string => {
  if (!id) throw new Error("Empty id");

  // Handle human-friendly UUIDs: e.g., MED-7FA34B21
  if (id.startsWith("MED-") || id.startsWith("HOSP-")) {
    const hexPart = id.split("-")[1]; // take "7FA34B21"
    if (!/^[0-9A-Fa-f]+$/.test(hexPart)) {
      throw new Error(`Invalid UUID format: ${id}`);
    }
    return "0x" + hexPart.toLowerCase();
  }

  // Handle already-encoded hex (e.g., from contract)
  if (id.startsWith("0x")) {
    return id;
  }

  // Fallback: encode as short string
  return shortString.encodeShortString(id);
};

/**
 * Generate a deterministic short ID for patients/hospitals
 * Example: "PAT-7FA34B21" or "HOSP-98AB12CD"
 */
export const deriveUUID = (
  address: string,
  role: "patient" | "hospital"
): string => {
  const roleFelt = shortString.encodeShortString(role);
  const feltHash = hash.computeHashOnElements([address, roleFelt]);

  const shortId = feltHash.replace(/^0x/, "").toUpperCase().slice(0, 8);
  const prefix = role === "patient" ? "PAT-" : "HOSP-";

  return `${prefix}${shortId}`;
};

/**
 * Convert felt back into short string
 */
export const fromFeltUUID = (felt: string): string => {
  try {
    return shortString.decodeShortString(felt);
  } catch (err) {
    console.error("fromFeltUUID decode error:", err);
    return felt; // fallback to raw felt if decoding fails
  }
};
