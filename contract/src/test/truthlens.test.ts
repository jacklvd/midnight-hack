import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { TruthLensSimulator } from "./truthlens-simulator.js";

setNetworkId("undeployed");

const hexToBytes32 = (hex: string): Uint8Array => {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length !== 64) {
    throw new Error(`expected 32-byte hex (64 chars), got ${clean.length}`);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};

const SAMPLE_HASH = hexToBytes32(
  "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2",
);
const SAMPLE_MODEL_ID = hexToBytes32(
  "11".repeat(32),
);

describe("TruthLens smart contract", () => {
  it("initializes with empty verdicts and round=0", () => {
    const sim = new TruthLensSimulator();
    const ledger = sim.getLedger();
    expect(ledger.round).toEqual(0n);
    expect(ledger.verdicts.isEmpty()).toBe(true);
    expect(ledger.verdicts.size()).toEqual(0n);
  });

  it("records a verdict and round-trips it via lookup", () => {
    const sim = new TruthLensSimulator();
    sim.setPendingAnalysis({
      media_hash: SAMPLE_HASH,
      score: 8920n,
      model_id: SAMPLE_MODEL_ID,
    });

    const ledger = sim.recordVerdict();

    expect(ledger.verdicts.member(SAMPLE_HASH)).toBe(true);
    expect(ledger.verdicts.size()).toEqual(1n);
    const record = ledger.verdicts.lookup(SAMPLE_HASH);
    expect(record.score).toEqual(8920n);
    expect(record.model_id).toEqual(SAMPLE_MODEL_ID);
    expect(record.round).toEqual(0n);
    expect(ledger.round).toEqual(1n);
  });

  it("records multiple distinct verdicts under different hashes", () => {
    const sim = new TruthLensSimulator();
    const hashA = hexToBytes32("aa".repeat(32));
    const hashB = hexToBytes32("bb".repeat(32));

    sim.setPendingAnalysis({
      media_hash: hashA,
      score: 9500n,
      model_id: SAMPLE_MODEL_ID,
    });
    sim.recordVerdict();

    sim.setPendingAnalysis({
      media_hash: hashB,
      score: 1200n,
      model_id: SAMPLE_MODEL_ID,
    });
    const ledger = sim.recordVerdict();

    expect(ledger.verdicts.size()).toEqual(2n);
    expect(ledger.verdicts.lookup(hashA).score).toEqual(9500n);
    expect(ledger.verdicts.lookup(hashA).round).toEqual(0n);
    expect(ledger.verdicts.lookup(hashB).score).toEqual(1200n);
    expect(ledger.verdicts.lookup(hashB).round).toEqual(1n);
    expect(ledger.round).toEqual(2n);
  });

  it("throws when recordVerdict is called without pendingAnalysis set", () => {
    const sim = new TruthLensSimulator();
    expect(() => sim.recordVerdict()).toThrow(/pendingAnalysis/);
  });
});
