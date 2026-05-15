import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type { Ledger, Witnesses } from "./managed/truthlens/contract/index.js";

export type AnalysisResult = {
  media_hash: Uint8Array;
  score: bigint;
  model_id: Uint8Array;
};

export type TruthLensPrivateState = {
  pendingAnalysis: AnalysisResult | null;
};

export const initialPrivateState: TruthLensPrivateState = {
  pendingAnalysis: null,
};

export const witnesses: Witnesses<TruthLensPrivateState> = {
  getAnalysis(
    context: WitnessContext<Ledger, TruthLensPrivateState>,
  ): [TruthLensPrivateState, AnalysisResult] {
    const pending = context.privateState.pendingAnalysis;
    if (pending === null) {
      throw new Error(
        "getAnalysis witness called with no pendingAnalysis in private state. " +
          "Set privateState.pendingAnalysis before calling recordVerdict.",
      );
    }
    return [context.privateState, pending];
  },
};
