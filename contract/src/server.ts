import express, { type NextFunction, type Request, type Response } from "express";

import { EncodingError } from "./encoding.js";
import {
  type MidnightMode,
  type MidnightService,
  MidnightServiceError,
  SimulatorMidnightService,
} from "./services/midnight-service.js";

const PORT = Number(process.env.PORT ?? 7077);
const MODE: MidnightMode = (process.env.MIDNIGHT_MODE ?? "simulator").toLowerCase() as MidnightMode;

async function buildService(): Promise<MidnightService> {
  if (MODE === "chain") {
    const { ChainMidnightService } = await import("./services/chain-midnight-service.js");
    return ChainMidnightService.connect();
  }
  return new SimulatorMidnightService();
}

const app = express();
app.use(express.json({ limit: "1mb" }));

let servicePromise: Promise<MidnightService> | null = null;
function getService(): Promise<MidnightService> {
  if (!servicePromise) {
    servicePromise = buildService();
  }
  return servicePromise;
}

app.get("/health", async (_req, res, next) => {
  try {
    const service = await getService();
    res.json({
      status: "ok",
      mode: service.mode,
      contract_address: service.contractAddress,
    });
  } catch (err) {
    next(err);
  }
});

type CommitBody = {
  hash?: unknown;
  score?: unknown;
  model_id?: unknown;
};

app.post("/commit", async (req: Request<unknown, unknown, CommitBody>, res, next) => {
  try {
    const { hash, score, model_id } = req.body ?? {};
    if (typeof hash !== "string" || typeof score !== "number" || typeof model_id !== "string") {
      res.status(400).json({
        detail: "Body must include {hash: string, score: number, model_id: string}.",
      });
      return;
    }

    const service = await getService();
    const result = await service.commit({ hash, score, modelId: model_id });

    res.json({
      tx_id: result.txId,
      status: result.status,
      committed_at: result.committedAt,
      round: result.round,
      contract_address: service.contractAddress,
      mode: service.mode,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/verify/:hash", async (req, res, next) => {
  try {
    const service = await getService();
    const result = await service.verify(req.params.hash);

    if (!result.exists) {
      res.json({
        exists: false,
        hash: result.hash,
        contract_address: service.contractAddress,
        mode: service.mode,
      });
      return;
    }

    res.json({
      exists: true,
      hash: result.hash,
      score: result.score,
      model_id: result.modelId,
      tx_id: result.txId,
      committed_at: result.committedAt,
      round: result.round,
      contract_address: service.contractAddress,
      mode: service.mode,
    });
  } catch (err) {
    next(err);
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof EncodingError || err instanceof MidnightServiceError) {
    res.status(err.statusCode).json({ detail: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : "Internal error";
  console.error("[midnight-sidecar] unhandled error:", err);
  res.status(500).json({ detail: message });
});

app.listen(PORT, () => {
  console.log(`[midnight-sidecar] listening on http://127.0.0.1:${PORT} (mode=${MODE})`);
});
