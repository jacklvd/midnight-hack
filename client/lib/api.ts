import type {
  AnalysisResponse,
  CommitRequest,
  CommitResponse,
  MidnightInfo,
  VerifyResponse,
} from '@/lib/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function parseError(response: Response, fallback: string): Promise<never> {
  let detail = fallback
  try {
    const body = await response.json()
    if (body && typeof body.detail === 'string') {
      detail = body.detail
    }
  } catch {
    // ignore parse failures and use the fallback message
  }
  throw new Error(detail)
}

export async function analyzeImage(file: File): Promise<AnalysisResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    await parseError(response, 'Failed to analyze image.')
  }

  return (await response.json()) as AnalysisResponse
}

export async function commitVerdict(payload: CommitRequest): Promise<CommitResponse> {
  const response = await fetch(`${API_BASE_URL}/api/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await parseError(response, 'Failed to commit verdict.')
  }

  return (await response.json()) as CommitResponse
}

export async function fetchSampleImage(): Promise<File> {
  const seed = Math.random().toString(36).slice(2, 10)
  const url = `https://picsum.photos/seed/${seed}/640/640`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch a sample image. Check your network connection.')
  }

  const blob = await response.blob()
  const contentType = blob.type || 'image/jpeg'
  const extension = contentType.split('/')[1] ?? 'jpg'
  return new File([blob], `sample-${seed}.${extension}`, { type: contentType })
}

export async function fetchMidnightInfo(): Promise<MidnightInfo> {
  const response = await fetch(`${API_BASE_URL}/api/midnight/info`, {
    method: 'GET',
  })

  if (!response.ok) {
    await parseError(response, 'Failed to load Midnight sidecar info.')
  }

  return (await response.json()) as MidnightInfo
}

export async function verifyVerdict(hash: string): Promise<VerifyResponse> {
  const response = await fetch(`${API_BASE_URL}/api/verify/${hash}`, {
    method: 'GET',
  })

  if (!response.ok) {
    await parseError(response, 'Failed to verify hash.')
  }

  return (await response.json()) as VerifyResponse
}
