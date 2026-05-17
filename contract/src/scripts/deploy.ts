/**
 * Phase B deploy script — NOT YET FUNCTIONAL against the installed SDK.
 *
 * The installed @midnight-ntwrk packages need a `WalletProvider` adapter that
 * wraps `@midnight-ntwrk/wallet` with the right `balanceTx` / coin-key methods,
 * plus glue to drive the wallet `Observable<WalletState>` to a synced state.
 *
 * Recommended path: clone https://github.com/midnightntwrk/example-bboard
 * (or the official Compact "counter" example), copy its provider-configuration
 * module and `deploy.ts`, then swap in our Contract + witnesses + circuit name
 * ("recordVerdict"). The ZK keys are already at
 * `contract/src/managed/truthlens/keys/` after `yarn compact`.
 *
 * Once deploy succeeds:
 *   - Save MIDNIGHT_CONTRACT_ADDRESS, MIDNIGHT_WALLET_SEED, MIDNIGHT_*_URL into
 *     `contract/.env.deploy`.
 *   - Update `chain-midnight-service.ts` with the same provider wiring.
 *   - Run `MIDNIGHT_MODE=chain yarn sidecar:dev`.
 */

console.error(
  "[deploy] Phase B deploy is not yet wired against the installed SDK.\n" +
    "         Copy provider-wiring from the official Midnight bboard/counter example.\n" +
    "         For now use the simulator: `yarn sidecar:dev` (no Docker required).",
);
process.exit(1);
