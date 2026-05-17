import { createHash } from "node:crypto";

export const SHA256_HEX_PATTERN = /^[a-fA-F0-9]{64}$/;
const MODEL_ID_HASH_DOMAIN = "truthlens:model:";

export function hexToBytes32(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!SHA256_HEX_PATTERN.test(clean)) {
    throw new EncodingError("Hash must be a 64-character SHA-256 hex string.");
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function bytes32ToHex(bytes: Uint8Array): string {
  if (bytes.length !== 32) {
    throw new EncodingError("Expected exactly 32 bytes.");
  }
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

export function modelIdToBytes32(modelId: string): Uint8Array {
  return new Uint8Array(
    createHash("sha256").update(MODEL_ID_HASH_DOMAIN + modelId).digest(),
  );
}

export function scoreFloatToUint(score: number): bigint {
  if (!Number.isFinite(score) || score < 0 || score > 1) {
    throw new EncodingError("Score must be a finite float in [0, 1].");
  }
  return BigInt(Math.round(score * 10_000));
}

export function scoreUintToFloat(score: bigint): number {
  return Number(score) / 10_000;
}

export class EncodingError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = "EncodingError";
  }
}
