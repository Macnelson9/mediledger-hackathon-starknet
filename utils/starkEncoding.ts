import { hash, shortString } from "starknet";


export const toFeltUUID = (id: string): string => {
  const idFelt = shortString.encodeShortString(id); 
  return hash.computeHashOnElements([idFelt]);
};

export const deriveUUID = (address: string, role: "patient" | "hospital"): string => {
  const roleFelt = shortString.encodeShortString(role);
  const feltHash = hash.computeHashOnElements([address, roleFelt]);
  const shortId = feltHash
    .replace(/^0x/, "")
    .toUpperCase()
    .slice(0, 8);
  const prefix = role === "patient" ? "PAT-" : "HOSP-";

  return `${prefix}${shortId}`;
};
