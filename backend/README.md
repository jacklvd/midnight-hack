---
title: TruthLens Backend
emoji: 🔍
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
short_description: Privacy-preserving deepfake detection API for TruthLens.
---

# TruthLens Backend

FastAPI service that runs the [`dima806/deepfake_vs_real_image_detection`](https://huggingface.co/dima806/deepfake_vs_real_image_detection)
ViT classifier and forwards verdicts to the TruthLens Midnight sidecar.

## Endpoints

- `POST /api/analyze` — multipart image upload, returns hash + label + confidence + model_id.
- `POST /api/commit` — forwards a verdict to the Midnight sidecar for on-chain commit.
- `GET /api/verify/{hash}` — looks up a previously committed verdict.
- `GET /api/midnight/info` — reports the sidecar's mode + contract address.
- `GET /api/health` — service health.

## Required Space environment variables

Set these in **Settings → Variables and secrets**:

- `TRUTHLENS_MIDNIGHT_SIDECAR_URL` — public URL of the Render-hosted Node sidecar
  (e.g. `https://truthlens-sidecar.onrender.com`).
- `TRUTHLENS_CORS_ORIGINS` — JSON array of allowed frontend origins
  (e.g. `["https://your-app.vercel.app","http://localhost:3000"]`).
