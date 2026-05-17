# TruthLens — ZK Deepfake Verification

TruthLens is a privacy-first deepfake verification dApp built for the Midnight blockchain hackathon. It lets users upload an image, run off-chain AI analysis, and commit a proof-backed verdict to Midnight while keeping the image private.

## Inspiration

Deepfakes are everywhere and the standard way to deal with them is broken: you either send the image to some third-party service (and lose privacy), or you trust a screenshot of a verdict that anyone could fake. Newsrooms, courts, and even regular people need a way to say "this image was checked, here's the result, and you can confirm it yourself" — without uploading the original image to a public database.

Midnight made this possible. It's a blockchain with privacy built in: you can prove a piece of work happened (like running a deepfake classifier) without revealing the inputs (your image) or the internals (the model). That fit our problem perfectly, so we built TruthLens around it.

## What it does

1. You drag an image into the app.
2. Our backend runs a deepfake classifier on it (a Hugging Face ViT model). The image never leaves the backend.
3. The backend hashes your image, packages the verdict (real or fake + confidence), and sends it to a Midnight smart contract.
4. The contract records only the hash, the score, and which model was used. The image itself, the model weights, and the intermediate AI outputs all stay private.
5. Anyone with the hash can later look up the verdict and confirm it matches the original image — without trusting us.

So the public record proves "this exact file got this verdict from this model" while the file itself never goes on-chain.

## How we built it

- **Smart contract** — written in Compact, Midnight's language for privacy circuits. It has one function (`recordVerdict`) that takes the private analysis result and publishes only what we want public.
- **AI backend** — FastAPI in Python, running the `dima806/deepfake_vs_real_image_detection` ViT model from Hugging Face. Hashes the image, runs the classifier, talks to the Midnight side.
- **Midnight sidecar** — small Node.js service that owns the contract. The Python backend calls it over HTTP. We split it out so the Python world doesn't have to wrestle with the Midnight TypeScript SDK directly.
- **Frontend** — Next.js + Tailwind + shadcn/ui. Three pages: analyze an image, verify a hash, and an instruction page that explains what we actually put on-chain and how to confirm it.
- **Deployment** — backend and sidecar both live on Hugging Face Spaces (Docker SDK), and the frontend is on Vercel.

## Challenges we ran into

- **The Midnight SDK is brand new.** The TypeScript API for wallets, providers, and contract deployment changed shape between recent versions, and the docs lagged behind. Wiring a wallet into the chain mode took longer than building everything else combined.
- **The AI model is heavy.** PyTorch and the ViT weights together are over a gigabyte. Vercel's free Python runtime caps out at 250 MB and Render's free tier has only 512 MB of RAM, so we had to find a host (Hugging Face Spaces) with enough headroom.
- **macOS hogged our port.** Port 7000 looked like a safe default for the sidecar until macOS Sonoma's AirPlay Receiver grabbed it. We switched the default to 7077 and moved on.
- **CORS surprises.** Running the frontend with HTTPS locally meant the browser sent `https://localhost:3000` as the origin, but our CORS config only allowed `http://localhost:3000`. Took a few request inspections to spot.
- **Honest scope cuts.** We wanted the chain mode (real ZK proofs, real on-chain transactions) live for the demo, but getting the SDK wired right needed more time than we had. We chose to ship simulator mode as a clearly-labeled fallback rather than fake the result.

## Accomplishments that we're proud of

- The contract isn't a mock — it's a real Compact circuit running the real witness/disclose pattern that Midnight is built around. Even in simulator mode, the ledger map and round counter are genuinely updated by circuit execution.
- We built an instruction page (`/how-it-works`) that's honest about what's real and what isn't. The verdict's privacy guarantees are spelled out so users can decide for themselves whether to trust it.
- Privacy isn't a marketing word for us. The image bytes, the model weights, and the model's intermediate outputs literally never reach the chain — we can show you exactly which line of Compact enforces that.
- The whole thing is deployed and reachable from the public internet on free-tier infra, with no manual scripts to run.

## What we learned

- How Compact's witness/disclose pattern works in practice. You design your circuit so that private data flows in through a witness, and only the values you explicitly `disclose()` make it to the public ledger. The compiler refuses to let private data leak by accident.
- Why blockchain projects split off-chain compute from on-chain commitment. The AI runs where it can (a GPU/CPU server), and the chain stores just enough to make the result tamper-evident.
- Hugging Face Spaces is genuinely usable for general-purpose Docker workloads — not just demo notebooks. We deployed both a Python ML backend and a Node service to it.
- Building for two modes (simulator and chain) from the start was worth the extra interface — we never had to "fake it" in the demo because simulator mode runs the real contract code.

## What's next for TruthLens

- **Wire chain mode end-to-end.** Use the Midnight reference repos (`example-bboard`, `example-counter`) to copy the wallet-provider plumbing we couldn't finish in time. Once that's in, our tx IDs become real Midnight transactions and the explorer links go live.
- **Move to Midnight testnet.** Local node is fine for development, but a public testnet deployment means anyone can verify a hash without trusting our backend.
- **Video deepfake detection.** Same architecture, different model and a frame-by-frame strategy.
- **Multi-model consensus.** Run several deepfake classifiers and commit the agreement (or disagreement) on-chain so users can see how robust a verdict actually is.
- **Browser extension.** Right-click any image on the web → check it against TruthLens → see the verdict overlaid. Most users won't paste hashes into a form, but they will install a button.

## Local development

### 1. Start the backend

From the repository root:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend exposes:
- `POST /api/analyze` for image analysis
- `POST /api/commit` for on-chain commit
- `GET /api/verify/{hash}` for verdict lookup

### 2. Start the frontend

Open a second terminal and run:

```bash
cd client
npm install
npm run dev
```

Then open `http://localhost:3000`.

### 3. Test the frontend flow

1. Open the app in the browser.
2. Upload an image file (PNG, JPG, WEBP, max 10 MB).
3. Click **Analyze image** to call the backend and get a deepfake verdict.
4. Click **Commit to Midnight** after analysis to record the verdict.
5. Visit `/verify` or click **Verify published hash** to look up a hash.

### Environment variables

Set `NEXT_PUBLIC_API_URL` in `client/.env.local` if the backend runs on a different host or port.

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Notes

- If the backend is not running, the frontend will fail when calling `/api/analyze` or `/api/commit`.
- The Midnight side runs in **simulator mode** by default — a real Compact circuit executing in-process. The `tx_id` returned by `/api/commit` is prefixed `sim_` to make this obvious. See [`/how-it-works`](http://localhost:3000/how-it-works) in the running app for the full breakdown of simulator vs. chain mode.
