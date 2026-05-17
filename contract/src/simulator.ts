import {
  type CircuitContext,
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "./managed/truthlens/contract/index.js";
import {
  type AnalysisResult,
  type TruthLensPrivateState,
  initialPrivateState,
  witnesses,
} from "./witnesses.js";

export class TruthLensSimulator {
  readonly contract: Contract<TruthLensPrivateState>;
  circuitContext: CircuitContext<TruthLensPrivateState>;

  constructor() {
    this.contract = new Contract<TruthLensPrivateState>(witnesses);
    const { currentPrivateState, currentContractState, currentZswapLocalState } =
      this.contract.initialState(
        createConstructorContext(initialPrivateState, "0".repeat(64)),
      );
    this.circuitContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState,
      currentPrivateState,
    );
  }

  getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  getPrivateState(): TruthLensPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  setPendingAnalysis(analysis: AnalysisResult): void {
    this.circuitContext = {
      ...this.circuitContext,
      currentPrivateState: {
        ...this.circuitContext.currentPrivateState,
        pendingAnalysis: analysis,
      },
    };
  }

  recordVerdict(): Ledger {
    this.circuitContext = this.contract.impureCircuits.recordVerdict(
      this.circuitContext,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }
}
