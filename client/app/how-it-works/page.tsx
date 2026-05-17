'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from '@/components/ui/copy-button'
import { Spinner } from '@/components/ui/spinner'
import { fetchMidnightInfo } from '@/lib/api'
import type { MidnightInfo } from '@/lib/types'

const MIDNIGHT_EXPLORER_TX_URL = (txId: string) =>
  `https://explorer.testnet.midnight.network/transactions/${txId}`
const MIDNIGHT_EXPLORER_CONTRACT_URL = (address: string) =>
  `https://explorer.testnet.midnight.network/contracts/${address}`
const INDEXER_GRAPHQL_URL = 'http://127.0.0.1:8088/api/v4/graphql'

export default function HowItWorksPage() {
  const [info, setInfo] = useState<MidnightInfo | null>(null)
  const [infoError, setInfoError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetchMidnightInfo()
      .then((data) => {
        if (mounted) setInfo(data)
      })
      .catch((err: unknown) => {
        if (mounted) setInfoError(err instanceof Error ? err.message : 'Unable to load status.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const isSimulator = info?.mode === 'simulator'
  const isChain = info?.mode === 'chain'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-secondary-foreground">
              TruthLens
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              How verification works — and why you can trust it
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              What we put on Midnight, what stays private, and how to confirm a verdict yourself.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="whitespace-nowrap rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Back to analysis
            </Link>
            <Link
              href="/verify"
              className="whitespace-nowrap rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Verify a hash
            </Link>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current system status</CardTitle>
            <CardDescription>Where your verdicts are being recorded right now.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" /> Checking sidecar…
              </div>
            ) : infoError ? (
              <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {infoError}
              </p>
            ) : info ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mode</p>
                  <p className="mt-2 text-lg font-semibold">
                    {isSimulator ? 'Simulator' : isChain ? 'Midnight chain' : info.mode}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isSimulator
                      ? 'Real Compact circuit running in-process. tx IDs are prefixed sim_ and live only on this machine.'
                      : isChain
                        ? 'Real ZK proofs, real on-chain transactions, persisted by the Midnight node.'
                        : 'Unknown mode.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Contract address
                    </p>
                    {info.contract_address ? (
                      <CopyButton value={info.contract_address} label="Copy address" />
                    ) : null}
                  </div>
                  <p
                    className="mt-2 break-all font-mono text-xs leading-relaxed"
                    title={info.contract_address}
                  >
                    {info.contract_address}
                  </p>
                  {isChain ? (
                    <a
                      className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                      href={MIDNIGHT_EXPLORER_CONTRACT_URL(info.contract_address)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Midnight Explorer ↗
                    </a>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Local-only address. Explorer link appears when running in chain mode.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What we put on Midnight</CardTitle>
            <CardDescription>
              Only fingerprints and verdicts — never the image, never the model.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted p-4">
              <p className="text-sm font-semibold">Recorded on-chain</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">media_hash</span> — SHA-256 of your
                  image (32 bytes)
                </li>
                <li>
                  <span className="font-medium text-foreground">score</span> — confidence × 10000
                  (uint64)
                </li>
                <li>
                  <span className="font-medium text-foreground">model_id</span> — SHA-256 of the
                  model identifier
                </li>
                <li>
                  <span className="font-medium text-foreground">round</span> — monotonic commit
                  counter
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-muted p-4">
              <p className="text-sm font-semibold">Stays private</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Your raw image bytes</li>
                <li>The model weights</li>
                <li>The model&apos;s intermediate outputs (logits)</li>
                <li>Any metadata embedded in the image</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Why the verdict can be trusted</CardTitle>
            <CardDescription>
              Four cryptographic guarantees built into the Compact contract.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Guarantee
              title="Image immutability"
              body="The 64-character hex hash is a SHA-256 of every byte of your image. Re-hash the same file later — even one pixel change produces a completely different hash. The verdict is bound to that exact file."
            />
            <Guarantee
              title="Verdict immutability"
              body="Once recordVerdict runs, the (hash, score, model_id, round) tuple is in the contract's verdicts Map. Compact's Map insert is single-write — the entry can't be edited or removed by a later call."
            />
            <Guarantee
              title="Model traceability"
              body="The model identifier is hashed and stored. Two verdicts for the same image under different models are distinguishable, and you can audit which model produced any given verdict."
            />
            <Guarantee
              title="Privacy by default"
              body="Compact treats everything as private unless explicitly disclosed. Our circuit only calls disclose() on the hash, score, and model_id — nothing else can leak."
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How to verify a verdict</CardTitle>
            <CardDescription>Two ways to confirm a TruthLens record independently.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-2xl border border-border bg-muted p-5">
              <p className="text-sm font-semibold">1. In TruthLens</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Hash the image (e.g.{' '}
                <span className="font-mono text-xs">shasum -a 256 image.jpg</span>) and paste the
                result on the{' '}
                <Link href="/verify" className="text-primary underline-offset-4 hover:underline">
                  Verify page
                </Link>
                . The contract returns whatever it has on record — or a clean &quot;not found&quot;
                if the image was never committed.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted p-5">
              <p className="text-sm font-semibold">2. Directly against Midnight</p>
              {isChain ? (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">
                    With a tx ID from a commit, jump straight to the explorer:
                  </p>
                  <p className="mt-3 text-xs font-mono break-all text-muted-foreground">
                    {MIDNIGHT_EXPLORER_TX_URL('<your_tx_id>')}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Or query the indexer GraphQL endpoint (
                    <span className="font-mono text-xs">{INDEXER_GRAPHQL_URL}</span>) for the
                    contract&apos;s ledger state, then read the{' '}
                    <span className="font-mono text-xs">verdicts</span> Map for your hash.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Right now the sidecar is in <strong>simulator mode</strong>, so tx IDs are
                    prefixed <span className="font-mono text-xs">sim_</span> and live only in this
                    process — they aren&apos;t broadcast to a Midnight node. The Compact circuit,
                    ledger Map, and round counter are real; the broadcast is the only thing missing.
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    When the sidecar is switched to chain mode (set{' '}
                    <span className="font-mono text-xs">MIDNIGHT_MODE=chain</span> after running the
                    deploy script), tx IDs become real Midnight transactions and you can look them
                    up at:
                  </p>
                  <p className="mt-3 text-xs font-mono break-all text-muted-foreground">
                    {MIDNIGHT_EXPLORER_TX_URL('<tx_id>')}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What &quot;simulator&quot; means here</CardTitle>
            <CardDescription>
              Being upfront about what is and isn&apos;t a real Midnight transaction.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground">
            <p>
              The TruthLens sidecar can run in two modes. Both execute the same Compact circuit and
              produce the same ledger updates — the difference is where the state lives.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-sm font-semibold text-foreground">Simulator (current default)</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>✓ Real Compact circuit code runs</li>
                  <li>
                    ✓ Real <span className="font-mono text-xs">verdicts</span> Map and{' '}
                    <span className="font-mono text-xs">round</span> counter
                  </li>
                  <li>✓ Real witness → disclose privacy flow</li>
                  <li>
                    ✗ tx ID is synthesized (prefixed <span className="font-mono text-xs">sim_</span>
                    )
                  </li>
                  <li>✗ State is in-memory only (lost on restart)</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-sm font-semibold text-foreground">Chain</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>✓ All of the above</li>
                  <li>✓ Real ZK proof generated by the proof server</li>
                  <li>✓ Real transaction on the Midnight node</li>
                  <li>✓ Persistent ledger via the indexer</li>
                  <li>✓ Verifiable on the public Midnight explorer</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function Guarantee({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted p-5">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  )
}
