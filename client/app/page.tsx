'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CopyButton } from '@/components/ui/copy-button'
import { Spinner } from '@/components/ui/spinner'
import { analyzeImage, commitVerdict, fetchSampleImage } from '@/lib/api'
import type { AnalysisResponse, CommitResponse } from '@/lib/types'

const formatConfidence = (confidence: number) => `${(confidence * 100).toFixed(1)}%`

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [commitResult, setCommitResult] = useState<CommitResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [isLoadingSample, setIsLoadingSample] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const statusLabel = useMemo(() => {
    if (commitResult) {
      return `Committed on Midnight — tx ${commitResult.tx_id}`
    }

    if (analysis) {
      return `Analysis ready: ${analysis.label}`
    }

    return 'Upload a photo to analyze it with TruthLens.'
  }, [analysis, commitResult])

  const handleFile = (candidate: File | null) => {
    setError(null)
    setCommitResult(null)
    setAnalysis(null)

    if (!candidate) {
      setFile(null)
      setPreview(null)
      return
    }

    if (!candidate.type.startsWith('image/')) {
      setError('Only image files are allowed.')
      return
    }

    if (candidate.size > 10_000_000) {
      setError('Image must be smaller than 10 MB.')
      return
    }

    setFile(candidate)
    setPreview(URL.createObjectURL(candidate))
  }

  const handleLoadSample = async () => {
    setIsLoadingSample(true)
    setError(null)
    setCommitResult(null)
    setAnalysis(null)

    try {
      const sample = await fetchSampleImage()
      setFile(sample)
      setPreview(URL.createObjectURL(sample))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample image.')
    } finally {
      setIsLoadingSample(false)
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError('Select an image first.')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setCommitResult(null)

    try {
      const response = await analyzeImage(file)
      setAnalysis(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCommit = async () => {
    if (!analysis) {
      setError('Analyze the image before committing.')
      return
    }

    setIsCommitting(true)
    setError(null)

    try {
      const response = await commitVerdict({
        hash: analysis.hash,
        score: analysis.confidence,
        model_id: analysis.model_id,
      })
      setCommitResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commit failed.')
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-secondary-foreground">
              TruthLens
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Privacy-first deepfake verification
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              Upload an image, analyze it with the backend AI engine, then commit a proof-backed
              verdict to Midnight.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/how-it-works"
              className="whitespace-nowrap rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              How it works
            </Link>
            <Link
              href="/verify"
              className="whitespace-nowrap rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Verify published hash
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader>
              <CardTitle>Analyze image</CardTitle>
              <CardDescription>{statusLabel}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                />
                <label
                  htmlFor="image-upload"
                  className="flex min-h-[180px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted p-6 text-center transition hover:border-primary hover:bg-muted/80"
                >
                  <span className="text-sm font-medium">Drag & drop an image or browse</span>
                  <span className="mt-2 text-sm text-muted-foreground">
                    PNG, JPG, or WEBP; max 10 MB
                  </span>
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="mt-4 max-h-48 w-full max-w-md rounded-2xl object-contain"
                    />
                  ) : null}
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Selected file</p>
                  <p className="font-medium">{file?.name ?? 'No image selected'}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={handleLoadSample}
                    disabled={isLoadingSample || isAnalyzing}
                  >
                    {isLoadingSample ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="size-4" /> Loading sample...
                      </span>
                    ) : (
                      'Try sample image'
                    )}
                  </Button>
                  <Button onClick={handleAnalyze} disabled={!file || isAnalyzing}>
                    {isAnalyzing ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="size-4" /> Analyzing...
                      </span>
                    ) : (
                      'Analyze image'
                    )}
                  </Button>
                </div>
              </div>

              {error ? (
                <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              {analysis ? (
                <div className="grid gap-4 rounded-3xl border border-border bg-background p-5">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">Verdict</p>
                    <p className="text-2xl font-semibold">{analysis.label}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border bg-muted p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Confidence
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatConfidence(analysis.confidence)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Model
                      </p>
                      <p className="mt-2 break-all text-sm font-medium" title={analysis.model_id}>
                        {analysis.model_id}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted p-4 sm:col-span-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Hash
                        </p>
                        <CopyButton value={analysis.hash} label="Copy hash" />
                      </div>
                      <p className="mt-2 break-all font-mono text-xs leading-relaxed">
                        {analysis.hash}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
            {analysis ? (
              <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Once committed, the image fingerprint and verdict are recorded on-chain.
                </p>
                <Button onClick={handleCommit} disabled={isCommitting}>
                  {isCommitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="size-4" /> Committing...
                    </span>
                  ) : (
                    'Commit to Midnight'
                  )}
                </Button>
              </CardFooter>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>
                Privacy is preserved by keeping raw images and model analysis off-chain.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="rounded-3xl border border-border bg-muted p-5">
                <p className="text-sm font-semibold">1. Analyze privately</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The backend runs deepfake detection and hashes the image.
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-muted p-5">
                <p className="text-sm font-semibold">2. Generate proof</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The contract records only the fingerprint and verdict, not the raw image.
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-muted p-5">
                <p className="text-sm font-semibold">3. Verify anytime</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Anyone can lookup a hash on the verification page to confirm the published
                  verdict.
                </p>
              </div>
            </CardContent>

            {commitResult ? (
              <CardFooter className="flex flex-col gap-3">
                <div className="rounded-3xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">Commit status</p>
                  <p className="mt-2 text-sm font-medium">{commitResult.status}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">TX ID</p>
                    <CopyButton value={commitResult.tx_id} label="Copy TX ID" />
                  </div>
                  <p
                    className="mt-1 break-all font-mono text-xs leading-relaxed"
                    title={commitResult.tx_id}
                  >
                    {commitResult.tx_id}
                  </p>
                  <Link
                    href="/how-it-works"
                    className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    What does this TX ID mean? →
                  </Link>
                </div>
              </CardFooter>
            ) : null}
          </Card>
        </div>
      </main>
    </div>
  )
}
