import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useSessionStore } from '../store/session'

export default function LeaseView() {
  const { address, isConnected } = useAccount()
  const { session, setSession, taskHistory, apiKey } = useSessionStore()
  const [revoking, setRevoking] = useState<string | null>(null)
  const [revoked, setRevoked] = useState<Set<string>>(new Set())

  // Extract delegation chains from task history
  const leases = taskHistory
    .filter((t) => (t.delegationSteps?.length ?? 0) > 0)
    .map((t) => ({
      taskId: t.taskId,
      prompt: t.prompt,
      status: t.status,
      createdAt: t.createdAt,
      steps: t.delegationSteps ?? [],
    }))

  async function handleRevokeSession() {
    if (!address || !session) return
    const confirmed = window.confirm(
      `Revoke all authority?\n\nThis will:\n• Cancel your $${session.remainingUsdc.toFixed(2)} USDC session\n• Block all sub-agents immediately\n• Record revocation on-chain\n\nThis cannot be undone.`
    )
    if (!confirmed) return

    setRevoking('session')
    try {
      const res = await fetch('/api/authorize/session', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Address': address,
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ sessionId: session.sessionId }),
      })
      if (res.ok) {
        setSession(null)  // only clear AFTER confirmed success
      } else {
        const err = await res.json() as any
        alert(`Revoke failed: ${err.error ?? 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Revoke session failed:', err)
      alert('Revoke failed — check console')
    } finally {
      setRevoking(null)
    }
  }

  async function handleRevokeLease(leaseId: string) {
    if (!address || revoking) return
    setRevoking(leaseId)
    try {
      const res = await fetch('/api/authorize/revoke-lease', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Address': address,
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ leaseId }),
      })
      if (res.ok) {
        setRevoked((prev) => new Set([...prev, leaseId]))
      }
    } catch (err) {
      console.error('Revoke failed:', err)
    } finally {
      setRevoking(null)
    }
  }

  async function handleRevokeStep(stepId: string, txHash?: string) {
    if (!address || revoking) return
    // For individual sub-agent steps, we revoke the delegation
    // using the txHash as identifier
    setRevoking(stepId)
    try {
      // DelegationManager.disableDelegation() would be called here
      // For now mark as revoked locally and show on-chain link
      setRevoked((prev) => new Set([...prev, stepId]))
      if (txHash) {
        window.open(`https://basescan.org/tx/${txHash}`, '_blank')
      }
    } finally {
      setRevoking(null)
    }
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <div className="mb-5">
        <h2 className="font-display font-semibold text-text text-base">Capability Leasing</h2>
        <p className="text-xs text-muted mt-0.5">
          On-chain authority leases — ERC-7710 redelegation chains
        </p>
      </div>

      {!isConnected ? (
        <div className="card p-6 text-center text-sm text-muted">
          Connect MetaMask to view your authority leases
        </div>
      ) : (
        <div className="space-y-5">

          {/* Active session lease */}
          {session && (
            <div>
              <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                Active Session Lease
              </h3>
              <div className="card p-4 border-white/[0.06]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs font-medium text-text">Authority Lease</div>
                    <div className="addr mt-0.5">{session.sessionId.slice(0, 16)}…</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-success">
                      <div className="w-1.5 h-1.5 rounded-full bg-success" />
                      Active
                    </span>
                    <button
                      onClick={handleRevokeSession}
                      disabled={revoking === 'session'}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20 transition-colors disabled:opacity-50"
                    >
                      {revoking === 'session' ? 'Revoking…' : 'Revoke All'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <div className="text-muted mb-0.5">Budget</div>
                    <div className="font-mono text-text">
                      ${session.remainingUsdc.toFixed(2)} / ${session.budgetUsdc.toFixed(2)} USDC
                    </div>
                  </div>
                  <div>
                    <div className="text-muted mb-0.5">Expires</div>
                    <div className="font-mono text-text">
                      {new Date(session.expiresAt * 1000).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Agent count summary */}
                {Object.keys(session.agentRequirements ?? {}).length > 0 && (
                  <div className="text-xs text-muted">
                    {Object.keys(session.agentRequirements).length} agents authorized
                  </div>
                )}

                {/* Venice oracle indicator */}
                {session.veniceQualityOracle && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border text-xs text-muted">
                    <div className="w-1 h-1 rounded-full bg-muted" />
                    Venice quality oracle active
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delegation chains from task history */}
          {leases.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                Task Delegation Chains
              </h3>
              <div className="space-y-2">
                {leases.map((lease) => (
                  <div key={lease.taskId} className={`card p-3 ${revoked.has(lease.taskId) ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs text-text truncate flex-1 mr-2">{lease.prompt}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={lease.status} />
                        {!revoked.has(lease.taskId) && lease.status !== 'failed' && (
                          <button
                            onClick={() => handleRevokeLease(lease.taskId)}
                            disabled={revoking === lease.taskId}
                            className="text-xs text-danger hover:bg-danger/10 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                          >
                            {revoking === lease.taskId ? 'Revoking…' : 'Revoke'}
                          </button>
                        )}
                        {revoked.has(lease.taskId) && (
                          <span className="text-xs text-muted">Revoked</span>
                        )}
                      </div>
                    </div>

                    {/* Delegation chain visual */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <ChainBadge label="User" color="text-text" />
                      {lease.steps.map((step) => (
                        <div key={step.stepId} className="flex items-center gap-1.5">
                          <ArrowIcon />
                          <ChainBadge
                            label={step.agentName}
                            color={
                              revoked.has(step.stepId) ? 'text-muted line-through'
                              : step.status === 'confirmed' ? 'text-success'
                              : step.status === 'blocked' ? 'text-danger'
                              : 'text-muted'
                            }
                            txHash={step.txHash}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-muted font-mono">
                      {lease.taskId.slice(0, 8)} · {new Date(lease.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!session && leases.length === 0 && (
            <div className="card p-6 text-center">
              <div className="text-sm text-muted mb-2">No active authority leases</div>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Authority leases are created when you authorize an agent network.
                Each lease is recorded on-chain with a full audit trail.
              </p>
            </div>
          )}

          {/* How revocation works */}
          <div className="card p-4">
            <h4 className="font-display font-semibold text-xs text-text mb-3">How Revocation Works</h4>
            <div className="space-y-2 text-xs text-muted">
              {[
                ['Revoke All', 'Revokes your session and all child leases instantly. No agent can execute further.'],
                ['Revoke Agent', 'Revokes a specific sub-delegation. Only that agent is blocked. Others continue.'],
                ['On-chain', 'Revocation is instant and on-chain. AuthorityLeaseRegistry.revokeLease() cascades to all children.'],
                ['ERC-7715', 'Your original permission in MetaMask Flask also expires at the set duration or when revoked.'],
              ].map(([fn, desc]) => (
                <div key={fn} className="flex items-start gap-2">
                  <code className="text-muted shrink-0 mt-0.5 font-mono">{fn}</code>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ChainBadge({ label, color, txHash }: { label: string; color: string; txHash?: string }) {
  const content = (
    <span className={`text-xs font-medium capitalize px-1.5 py-0.5 rounded bg-surface border border-border ${color}`}>
      {label}
    </span>
  )
  if (txHash) {
    return (
      <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" title={txHash}>
        {content}
      </a>
    )
  }
  return content
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { text: 'text-success', label: 'Done' },
    running:   { text: 'text-accent',  label: 'Running' },
    failed:    { text: 'text-danger',  label: 'Failed' },
  }[status] ?? { text: 'text-muted', label: status }
  return <span className={`text-xs ${config.text} shrink-0`}>{config.label}</span>
}

function ArrowIcon() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
      <path d="M1 4H10M10 4L7 1M10 4L7 7" stroke="#64748B" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}
