export * as TruthLens from "./managed/truthlens/contract/index.js";
export * from "./witnesses.js";
export { TruthLensSimulator } from "./simulator.js";
export {
  type CommitInput,
  type CommitResult,
  type MidnightMode,
  type MidnightService,
  type VerdictFound,
  type VerdictMissing,
  type VerifyResult,
  MidnightServiceError,
  SimulatorMidnightService,
} from "./services/midnight-service.js";
