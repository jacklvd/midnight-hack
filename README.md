# TruthLens — ZK Deepfake Verification

TruthLens is a privacy-first deepfake verification dApp built for the Midnight blockchain hackathon. It lets users upload an image, run off-chain AI analysis, and commit a proof-backed verdict to Midnight while keeping the image private.

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
- The frontend currently uses a mock Midnight client on the backend for proof/commit behavior.
