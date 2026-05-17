/**
 * Phase B — real-chain Midnight service. NOT YET WIRED.
 *
 * The installed @midnight-ntwrk SDK shape (wallet v5, midnight-js v4) requires
 * an adapter layer to satisfy the `WalletProvider` and `MidnightProvider`
 * interfaces from `@midnight-ntwrk/midnight-js-types`. The wallet returns
 * `Observable<WalletState>` from `state()`, exposes `balanceTransaction` +
 * `proveTransaction` (not `balanceTx`), and needs glue for coin/encryption
 * public keys.
 *
 * The cleanest path: copy the provider-configuration helper from a reference
 * project — e.g. https://github.com/midnightntwrk/example-bboard
 * (look at its `common-types`/`configureProviders` modules) — and swap our
 * Contract/witnesses/circuit name in.
 *
 * Until then, MIDNIGHT_MODE=chain fails loudly. Run with MIDNIGHT_MODE=simulator
 * (the default) — that path uses the real Compact circuit, real ledger Map,
 * and real round counter; only the tx_id is synthesized.
 */

import {
  type CommitInput,
  type CommitResult,
  type MidnightMode,
  type MidnightService,
  type VerifyResult,
  MidnightServiceError,
} from "./midnight-service.js";

export class ChainMidnightService implements MidnightService {
  readonly mode: MidnightMode = "chain";
  readonly contractAddress: string;

  private constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
  }

  static async connect(): Promise<ChainMidnightService> {
    throw new MidnightServiceError(
      "Chain mode is not yet wired against the installed SDK. " +
        "Copy provider-wiring code from the official Midnight bboard/counter example " +
        "and replace this method. For now, run with MIDNIGHT_MODE=simulator.",
      501,
    );
  }

  async commit(_input: CommitInput): Promise<CommitResult> {
    throw new MidnightServiceError("Chain mode not implemented.", 501);
  }

  async verify(_hash: string): Promise<VerifyResult> {
    throw new MidnightServiceError("Chain mode not implemented.", 501);
  }
}
