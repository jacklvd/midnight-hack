'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { verifyVerdict } from '@/lib/api'
import type { VerifyResponse } from '@/lib/types'

export default function VerifyPage() {
  const [hash, setHash] = useState('')
  const [result, setResult] = useState<VerifyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setResult(null)

    const trimmed = hash.trim()
    if (!/^[a-fA-F0-9]{64}$/.test(trimmed)) {
      setError('Enter a valid SHA-256 image hash.')
      return
    }

    setLoading(true)
    try {
      const response = await verifyVerdict(trimmed)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify hash.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-foreground">
              TruthLens
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Verify a published deepfake analysis
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Paste a SHA-256 image fingerprint to look up the recorded verdict on Midnight.
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
              href="/"
              className="whitespace-nowrap rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Back to analysis
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verify media fingerprint</CardTitle>
            <CardDescription>Lookup an on-chain verdict using the image hash.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleVerify}>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Image hash
                <input
                  value={hash}
                  onChange={(event) => setHash(event.target.value)}
                  placeholder="e.g. 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
                  className="rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" disabled={loading || hash.length === 0}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="size-4" /> Verifying...
                    </span>
                  ) : (
                    'Verify hash'
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">Hashes are case-insensitive.</p>
              </div>
              {error ? (
                <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>

        {result ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Verification result</CardTitle>
              <CardDescription>
                {result.exists ? 'Found on Midnight ledger' : 'No verdict found for this hash'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="mt-2 text-lg font-semibold">
                  {result.exists ? 'Verified' : 'Not found'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="mt-2 text-lg font-semibold">
                  {result.score === null ? 'N/A' : `${(result.score * 100).toFixed(1)}%`}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Model ID</p>
                <p className="mt-2 text-sm break-all">{result.model_id ?? 'N/A'}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Transaction</p>
                <p className="mt-2 text-sm break-all">{result.tx_id ?? 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  )
}
