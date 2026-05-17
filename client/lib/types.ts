export interface AnalysisResponse {
  hash: string
  label: string
  confidence: number
  model_id: string
}

export interface CommitRequest {
  hash: string
  score: number
  model_id: string
  label?: string
}

export interface CommitResponse {
  hash: string
  score: number
  model_id: string
  status: string
  tx_id: string
  committed_at: string
}

export interface MidnightInfo {
  status: string
  mode: 'simulator' | 'chain' | string
  contract_address: string
  sidecar_url: string
}

export interface VerifyResponse {
  hash: string
  exists: boolean
  status: string
  score: number | null
  model_id: string | null
  tx_id: string | null
  committed_at: string | null
}
