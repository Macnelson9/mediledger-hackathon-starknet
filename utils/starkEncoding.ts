import { hash } from "starknet";


export const toFeltUUID = (id: string): string => {
  return hash.computeHashOnElements([id]);
};

export const deriveUUID = (address: string, role: "patient" | "hospital"): string => {
  const feltHash = hash.computeHashOnElements([address, role]);
  const shortId = feltHash
    .replace(/^0x/, "")
    .toUpperCase()
    .slice(0, 8);
  const prefix = role === "patient" ? "PAT-" : "HOSP-";

  return `${prefix}${shortId}`;
};

