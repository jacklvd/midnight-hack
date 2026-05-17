import { createHash, randomBytes } from "node:crypto";
import { sampleContractAddress } from "@midnight-ntwrk/compact-runtime";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

import { TruthLensSimulator } from "../simulator.js";
import {
  bytes32ToHex,
  hexToBytes32,
  modelIdToBytes32,
  scoreFloatToUint,
  scoreUintToFloat,
} from "../encoding.js";

export type CommitInput = {
  hash: string;
  score: number;
  modelId: string;
};

export type CommitResult = {
  txId: string;
  status: "committed";
  committedAt: string;
  round: number;
};

export type VerdictFound = {
  exists: true;
  hash: string;
  score: number;
  modelId: string;
  txId: string;
  committedAt: string;
  round: number;
};

export type VerdictMissing = {
  exists: false;
  hash: string;
};

export type VerifyResult = VerdictFound | VerdictMissing;

export type MidnightMode = "simulator" | "chain";

export interface MidnightService {
  readonly mode: MidnightMode;
  readonly contractAddress: string;
  commit(input: CommitInput): Promise<CommitResult>;
  verify(hash: string): Promise<VerifyResult>;
}

export class MidnightServiceError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "MidnightServiceError";
    this.statusCode = statusCode;
  }
}

type SideIndexEntry = {
  modelId: string;
  txId: string;
  committedAt: string;
};

export class SimulatorMidnightService implements MidnightService {
  readonly mode: MidnightMode = "simulator";
  readonly contractAddress: string;
  private readonly sim: TruthLensSimulator;
  private readonly sideIndex = new Map<string, SideIndexEntry>();

  constructor() {
    setNetworkId("undeployed");
    this.sim = new TruthLensSimulator();
    this.contractAddress = sampleContractAddress();
  }

  async commit({ hash, score, modelId }: CommitInput): Promise<CommitResult> {
    const hashBytes = hexToBytes32(hash);
    const modelBytes = modelIdToBytes32(modelId);
    const scoreUint = scoreFloatToUint(score);

    const currentLedger = this.sim.getLedger();
    if (currentLedger.verdicts.member(hashBytes)) {
      throw new MidnightServiceError(
        "A verdict for this image hash is already committed.",
        409,
      );
    }

    this.sim.setPendingAnalysis({
      media_hash: hashBytes,
      score: scoreUint,
      model_id: modelBytes,
    });
    const ledger = this.sim.recordVerdict();
    const record = ledger.verdicts.lookup(hashBytes);
    const round = Number(record.round);

    const committedAt = new Date().toISOString();
    const txId = synthesizeTxId(hashBytes, scoreUint, modelBytes, round);

    this.sideIndex.set(hash.toLowerCase(), {
      modelId,
      txId,
      committedAt,
    });

    return {
      txId,
      status: "committed",
      committedAt,
      round,
    };
  }

  async verify(hash: string): Promise<VerifyResult> {
    const hashBytes = hexToBytes32(hash);
    const ledger = this.sim.getLedger();

    if (!ledger.verdicts.member(hashBytes)) {
      return { exists: false, hash: hash.toLowerCase() };
    }

    const record = ledger.verdicts.lookup(hashBytes);
    const side = this.sideIndex.get(hash.toLowerCase());

    return {
      exists: true,
      hash: hash.toLowerCase(),
      score: scoreUintToFloat(record.score),
      modelId: side?.modelId ?? bytes32ToHex(record.model_id),
      txId: side?.txId ?? "unknown",
      committedAt: side?.committedAt ?? new Date(0).toISOString(),
      round: Number(record.round),
    };
  }
}

function synthesizeTxId(
  hashBytes: Uint8Array,
  score: bigint,
  modelBytes: Uint8Array,
  round: number,
): string {
  const payload = Buffer.concat([
    Buffer.from(hashBytes),
    Buffer.from(score.toString()),
    Buffer.from(modelBytes),
    Buffer.from(String(round)),
    randomBytes(4),
  ]);
  const digest = createHash("sha256").update(payload).digest("hex");
  return `sim_${digest.slice(0, 32)}`;
}
