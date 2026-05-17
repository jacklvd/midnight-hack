# TruthLens Client

This is the Next.js frontend for TruthLens, the deepfake verification dApp.

## Local development

From the `client` folder:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing the frontend locally

1. Start the backend from the repo root:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

2. Start the frontend:

```bash
cd client
npm run dev
```

3. Open the app and:
- Upload an image file
- Click **Analyze image**
- After analysis, click **Commit to Midnight**
- Visit `/verify` to look up the reported hash

## Configuration

If the backend is not on `http://localhost:8000`, add `NEXT_PUBLIC_API_URL` to `client/.env.local`.

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Notes

- The current UI uses backend API endpoints for analysis and commit.
- The verification page is available at `/verify`.
