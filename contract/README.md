---
title: TruthLens Sidecar
emoji: 🌙
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
short_description: Node Express service driving the TruthLens Compact contract.
---

# TruthLens Midnight Sidecar

Express HTTP service that runs the TruthLens Compact contract. The backend
(FastAPI) calls this service to commit and verify verdicts.

## Endpoints

- `GET /health` — `{ status, mode, contract_address }`
- `POST /commit` — body `{ hash, score, model_id }` → `{ tx_id, status, committed_at, round, contract_address, mode }`
- `GET /verify/:hash` — `{ exists, hash, score, model_id, tx_id, committed_at, round, contract_address, mode }`

## Modes

- **`simulator`** (default) — runs the real Compact circuit in-process, in-memory
  ledger Map and round counter. `tx_id`s are prefixed `sim_`. No Docker stack needed.
- **`chain`** — not yet wired against the installed SDK. See
  `src/services/chain-midnight-service.ts`.

## Required Space environment variables

Set in **Settings → Variables and secrets**:

- `MIDNIGHT_MODE` = `simulator` (already defaulted in the Dockerfile).
