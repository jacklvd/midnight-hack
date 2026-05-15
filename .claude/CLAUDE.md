# CLAUDE.md — TruthLens: ZK-Verified Deepfake Detection on Midnight

## Project overview

TruthLens or D-Fake is a privacy-preserving deepfake detection dApp built on the Midnight blockchain for the MLH Midnight Hackathon (May 15-17, 2026). Users upload an image, an off-chain AI classifier analyzes it, and a zero-knowledge proof is committed on-chain — proving the analysis happened correctly without revealing the image, model weights, or raw analysis.

**Hackathon tracks:** AI Track (primary), First-Time Hackers (secondary)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend — Next.js 15 + TypeScript + shadcn/ui     │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  Upload   │  │Lace Wallet│  │  Result Badge    │  │
│  │  Dropzone │  │ Connect   │  │  + Verify Page   │  │
│  └──────────┘  └───────────┘  └──────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ POST /api/analyze (image bytes)
                       ▼
┌─────────────────────────────────────────────────────┐
│  Backend — FastAPI (Python 3.11+)                   │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │ HuggingFace ViT │  │ Hash + Score Bundler     │  │
│  │ Deepfake Model  │  │ SHA-256 media fingerprint│  │
│  └─────────────────┘  └──────────────────────────┘  │
│  ┌─────────────────────────────────────────────┐    │
│  │ Midnight Integration Layer                  │    │
│  │ Calls contract via @midnight-ntwrk SDK      │    │
│  └─────────────────────────────────────────────┘    │
│  PRIVATE: raw image, model weights, logits          │
└──────────────────────┬──────────────────────────────┘
                       │ witness: (media_hash, score, model_id)
                       ▼
┌─────────────────────────────────────────────────────┐
│  On-chain — Compact Smart Contract (Midnight)       │
│  ┌───────────────┐  ┌────────────────────────────┐  │
│  │ witness        │  │ circuit: recordVerdict     │  │
│  │ getAnalysis()  │  │ ZK proof generation        │  │
│  └───────────────┘  └────────────────────────────┘  │
│  ┌─────────────────────────────────────────────┐    │
│  │ Public Ledger State                         │    │
│  │ media_hash, score, model_id, timestamp      │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## Tech stack

### Frontend
- **Framework:** Next.js 15 (App Router) with TypeScript
- **UI:** shadcn/ui + Tailwind CSS v4
- **Wallet:** Lace browser extension (Midnight-compatible)
- **Key libs:** `@midnight-ntwrk/midnight-js-*` SDK packages for contract interaction
- **State:** React hooks (useState/useReducer) — no external state library needed at this scale

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **AI Model:** HuggingFace Transformers — `dima806/deepfake_vs_real_image_detection` (ViT, 99.27% accuracy)
  - Alternative: `prithivMLmods/Deep-Fake-Detector-v2-Model` (92% accuracy, lighter)
  - Ollama option: use `llava` or similar vision model with a classification prompt (lower accuracy but local)
- **Hashing:** hashlib SHA-256
- **Midnight SDK:** Use the TypeScript SDK via a small Node.js sidecar, OR call Midnight RPC directly from Python

### Smart Contract
- **Language:** Compact (Midnight's TypeScript-like DSL)
- **Compiler:** `compact` CLI (compiler v0.31.0 via toolchain `compact` v0.5.1)
- **Language version:** `pragma language_version >= 0.20;` in `.compact` files
- **Runtime:** `@midnight-ntwrk/compact-runtime` `0.16.0` (must match compiler's emitted runtime)
- **Proof server:** Docker — `midnightntwrk/proof-server:8.0.3` on port 6300
- **Node:** Docker — `midnightntwrk/midnight-node:0.22.3` on port 9944
- **Indexer:** Docker — `midnightntwrk/indexer-standalone:4.0.1` on port 8088

### Infrastructure (local dev)
- **Docker services:**
  - Midnight Node: port 9944
  - Indexer: port 8088 (GraphQL at `/api/v4/graphql`)
  - Proof Server: port 6300
  - Explorer: port 3000 (optional)
- **Network ID:** `undeployed` for local, `testnet` for deployment

## Key Midnight concepts for this project

### Witnesses
Witnesses are functions declared in Compact but implemented in TypeScript. They run off-chain on the user's machine and provide private data to circuits. The private data never reaches the chain. In our case, the witness provides the AI analysis results (hash, score, model_id) to the circuit.

```compact
witness getAnalysis(): AnalysisResult;
```

The TypeScript implementation of this witness calls our FastAPI backend, gets the analysis, and returns it to the circuit.

### Circuits
Circuits are the entry points of the contract. They run logic, generate ZK proofs, and update ledger state. Our main circuit `recordVerdict` takes the witness data, validates it, and uses `disclose()` to publish only what we want public.

### disclose()
Compact treats all data as private by default. You must explicitly call `disclose()` to move a value from private to public ledger state. This is the core privacy mechanism — forgetting `disclose()` means the value stays private (compiler error if you try to assign it to public state).

### Ledger
The `export ledger` declarations define what's stored on-chain (public). Our contract stores:
- `media_hash: Bytes<32>` — SHA-256 of the original image
- `score: Uint<64>` — confidence score (0-10000, representing 0.00%-100.00%)
- `model_id: Bytes<32>` — hash identifying which AI model was used
- `round: Counter` — for anonymity (standard Midnight pattern)

## File naming conventions
- Compact contracts: `.compact` extension
- TypeScript: strict mode, ES modules
- Python: type hints everywhere, async endpoints
- Component files: PascalCase (e.g., `UploadDropzone.tsx`)
- API routes: kebab-case (e.g., `/api/analyze`)
- Utility files: camelCase (e.g., `hashImage.ts`)

## Environment variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MIDNIGHT_NETWORK=undeployed
NEXT_PUBLIC_INDEXER_URL=http://127.0.0.1:8088/api/v4/graphql
NEXT_PUBLIC_INDEXER_WS=ws://127.0.0.1:8088/api/v4/graphql/ws
NEXT_PUBLIC_NODE_URL=http://127.0.0.1:9944
NEXT_PUBLIC_PROOF_SERVER_URL=http://127.0.0.1:6300
```

### Backend (.env)
```
HF_MODEL_NAME=dima806/deepfake_vs_real_image_detection
MIDNIGHT_NODE_URL=http://127.0.0.1:9944
MIDNIGHT_INDEXER_URL=http://127.0.0.1:8088/api/v4/graphql
MIDNIGHT_PROOF_SERVER_URL=http://127.0.0.1:6300
MIDNIGHT_NETWORK_ID=undeployed
CORS_ORIGINS=http://localhost:3000
```

## Critical rules

1. **Version alignment is critical.** The Compact compiler version, `@midnight-ntwrk/compact-runtime` version, and proof server Docker tag must all be compatible. Check the compatibility matrix at docs.midnight.network before upgrading anything.

2. **Never put raw image data on-chain.** Only the SHA-256 hash goes to the ledger. The image stays on the backend server and is discarded after analysis.

3. **Use `disclose()` intentionally.** Every value that appears in `export ledger` state must pass through `disclose()` in the circuit. Forgetting it causes a compiler error. Adding it carelessly leaks private data.

4. **Witnesses are untrusted.** The contract cannot verify that the witness data is "real" — it trusts whatever the TypeScript implementation provides. For the hackathon demo, this is fine. In production, you'd need an oracle pattern or TEE attestation.

5. **Proof generation is slow.** The proof server can take 10-30 seconds to generate a ZK proof. Show a loading state in the UI. Don't let the user think the app is frozen.

6. **Lace wallet is required.** Users need the Lace browser extension configured for the Midnight network. Include setup instructions in the README.

7. **The AI model runs on the backend only.** Never send model weights or raw classification logits to the frontend or on-chain. The frontend only sees the final verdict.

## API contract

### POST /api/analyze
```json
// Request: multipart/form-data
// Field: "file" (image file, max 10MB)

// Response 200:
{
  "media_hash": "a1b2c3d4...",        // SHA-256 hex string
  "score": 8920,                       // 0-10000 (89.20% authentic)
  "label": "Real",                     // "Real" or "Fake"
  "model_id": "dima806/deepfake...",   // model identifier
  "confidence": 0.892                  // float 0-1 for display
}
```

### GET /api/verify/{media_hash}
```json
// Response 200:
{
  "verified": true,
  "media_hash": "a1b2c3d4...",
  "score": 8920,
  "model_id": "dima806/deepfake...",
  "timestamp": "2026-05-16T14:30:00Z",
  "on_chain": true
}
```

### POST /api/commit
```json
// Request:
{
  "media_hash": "a1b2c3d4...",
  "score": 8920,
  "model_id": "dima806/deepfake..."
}

// Response 200:
{
  "tx_hash": "0xabc123...",
  "status": "committed",
  "proof_generated": true
}
```

## Demo flow (what judges will see)

1. User opens TruthLens → connects Lace wallet
2. Drags an image into the upload zone
3. Loading spinner: "Analyzing with AI..." (backend processes)
4. Result card appears: "89.2% likely authentic" with a green/red badge
5. User clicks "Commit to Midnight" → loading: "Generating ZK proof..."
6. Success: "Verified on-chain! Anyone can check this image's authenticity"
7. Verification page: paste an image or hash → see its on-chain verdict
8. Key point in pitch: "The image, the model, and the analysis are private. Only the fingerprint and verdict are public. Privacy by default."

## Common pitfalls to avoid

- **Don't use `npm` and `bun` in the same project** — pick one and stick with it
- **Don't forget to start Docker** before running the proof server
- **Don't hardcode network endpoints** — use env vars so you can switch between local/testnet
- **Don't skip the Compact compiler installation step** — it's a separate binary, not an npm package
- **Don't try to deploy to mainnet during the hackathon** — use testnet or local network
- **Don't over-engineer** — this is a 48-hour hackathon, not a production system

## Useful links

- Midnight docs: https://docs.midnight.network
- Compact language reference: https://docs.midnight.network/compact/reference/compact-reference
- Midnight Academy: https://midnight.network/academy
- Midnight Discord (#mlh-hackers): https://discord.gg/midnight
- Create Midnight App: `npx create-mn-app`
- HuggingFace model: https://huggingface.co/dima806/deepfake_vs_real_image_detection
- Lace Wallet: https://www.lace.io/
