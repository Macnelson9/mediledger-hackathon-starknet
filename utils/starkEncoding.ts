import { hash } from "starknet";


export const toFeltUUID = (id: string): string => {
  return hash.computeHashOnElements([id]);
};

export const deriveUUID = (address: string, role: "patient" | "hospital"): string => {
  return hash.computeHashOnElements([address, role]);
};
