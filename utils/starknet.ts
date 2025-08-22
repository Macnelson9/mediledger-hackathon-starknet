/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/starknet.ts
export function stringToFeltArray(input: string): string[] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  return Array.from(bytes).map((b) => b.toString());
}

// check contract return (some Starknet contracts return "1" for true, or an object)
// normalize it here:
export function isVerified(response: any): boolean {
  if (!response) return false;
  if (typeof response === "object" && "result" in response) {
    return response.result[0] !== "0";
  }
  return Boolean(response);
}
