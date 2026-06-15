import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useSessionStore } from '../store/session'
import { authorize } from '../lib/api'
import { DELEGATION_MANAGER } from '../config/wagmi'
import { requestExecutionPermissions } from '../lib/permissions'
import type { ChatSession } from '../store/session'

interface Props {
  onClose: () => void
  onAuthorized?: (session: ChatSession) => void
  chatId?: string
  chatName?: string
}

interface AgentReq {
  minReputation: number
  minRevenue: number
  maxBudget: number
}

const DEFAULT_REQS: Record<string, AgentReq> = {
  coordinator:  { minReputation: 70, minRevenue: 0, maxBudget: 1 },
  research:     { minReputation: 80, minRevenue: 0, maxBudget: 3 },
  audit:        { minReputation: 85, minRevenue: 0, maxBudget: 4 },
  report:       { minReputation: 75, minRevenue: 0, maxBudget: 2 },
  counsel:      { minReputation: 85, minRevenue: 0, maxBudget: 3 },
  intelligence: { minReputation: 80, minRevenue: 0, maxBudget: 3 },
  reflection:   { minReputation: 70, minRevenue: 0, maxBudget: 2 },
  reputation:   { minReputation: 75, minRevenue: 0, maxBudget: 2 },
  monitor:      { minReputation: 70, minRevenue: 0, maxBudget: 1 },
  executor:     { minReputation: 80, minRevenue: 0, maxBudget: 2 },
}

export default function AuthorizeModal({ onClose, onAuthorized, chatId, chatName }: Props) {
  const { address } = useAccount()
  const { apiKey, veniceQualityOracle, setVeniceQualityOracle } = useSessionStore()

  const [budget, setBudget] = useState(10)
  const [duration, setDuration] = useState(24)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [reqs, setReqs] = useState<Record<string, AgentReq>>(DEFAULT_REQS)
  const [status, setStatus] = useState<'idle' | 'signing' | 'authorizing' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [permissionMethod, setPermissionMethod] = useState<string>('')

  function updateReq(agent: string, field: keyof AgentReq, value: number) {
    setReqs((prev) => ({ ...prev, [agent]: { ...prev[agent]!, [field]: value } }))
  }

  async function handleAuthorize() {
    if (!address) return
    setStatus('signing')
    setErrorMsg('')

    try {
      const result = await requestExecutionPermissions({
        budgetUsdc: budget,
        durationHours: duration,
      })

      setPermissionMethod(result.method)
      const effectiveAddress = result.address ?? address
      if (result.isDemo) console.warn('Using demo permissionsContext')
      const permissionsContext = result.permissionsContext

      setStatus('authorizing')

      const authResult = await authorize(
        {
          permissionsContext,
          delegationManager: DELEGATION_MANAGER,
          budget: `${budget} USDC`,
          actions: ['coordinate', 'research', 'audit', 'report', 'counsel', 'intelligence', 'reflection', 'reputation', 'monitor', 'execute'],
          durationHours: duration,
          agentRequirements: reqs,
          veniceQualityOracle,
          chatId,
          chatName: chatName ?? 'New Chat',
        },
        effectiveAddress ?? address ?? '',
        apiKey
      )

      const session: ChatSession = {
        sessionId: authResult.leaseId,
        chatId: chatId ?? authResult.chatId ?? '',
        budgetUsdc: authResult.budgetUsdc,
        remainingUsdc: authResult.remainingUsdc,
        spentUsdc: 0,
        expiresAt: authResult.expiresAt,
        allowedActions: ['research', 'audit', 'report'],
        agentRequirements: authResult.agentRequirements ?? reqs,
        veniceQualityOracle: authResult.veniceQualityOracle ?? veniceQualityOracle,
        permissionsContext,
        delegationManager: DELEGATION_MANAGER,
        isExpired: false,
      }

      setStatus('done')
      setTimeout(() => {
        onClose()
        onAuthorized?.(session)
      }, 800)
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Authorization failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md card animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-display font-semibold text-text text-sm">
              Authorize Agent Network
            </h2>
            <p className="text-xs text-muted mt-0.5">
              One approval — agents handle the rest
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors p-1"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Budget */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-text">
                Total Budget
              </label>
              <span className="font-mono text-sm font-semibold text-accent">
                ${budget} USDC
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-accent h-1 rounded-full"
            />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>$1</span>
              <span>~{Math.floor(budget / 0.05)} agent calls</span>
              <span>$100</span>
            </div>
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-text">Duration</label>
              <span className="font-mono text-xs text-muted">
                {duration}h
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 6, 24, 72].map((h) => (
                <button
                  key={h}
                  onClick={() => setDuration(h)}
                  className={`py-1.5 rounded-md text-xs font-medium transition-colors ${
                    duration === h
                      ? 'bg-white text-black'
                      : 'bg-white/[0.04] border border-white/[0.08] text-muted hover:text-text hover:bg-white/[0.08]'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* Venice quality oracle toggle */}
          <div className="flex items-center justify-between py-2 border-t border-border">
            <div>
              <div className="text-xs font-medium text-text">Venice Quality Oracle</div>
              <div className="text-xs text-muted mt-0.5">
                Venice scores each agent after execution and writes reputation
              </div>
            </div>
            <button
              onClick={() => setVeniceQualityOracle(!veniceQualityOracle)}
              className={`w-9 h-5 rounded-full transition-colors shrink-0 ${
                veniceQualityOracle ? 'bg-accent2' : 'bg-border'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white mx-auto transition-transform ${
                veniceQualityOracle ? 'translate-x-2' : '-translate-x-2'
              }`} />
            </button>
          </div>

          {/* Advanced — per-agent requirements */}
          <div className="border-t border-border pt-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors"
            >
              <span>{showAdvanced ? '▾' : '▸'}</span>
              <span>Per-agent trust requirements</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 animate-fade-in">
                {Object.entries(reqs).map(([agent, req]) => (
                  <div key={agent} className="p-3 rounded-md bg-bg border border-border">
                    <div className="text-xs font-medium text-text capitalize mb-2.5">
                      {agent} agent
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-xs text-muted mb-1">Min Rep</div>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={req.minReputation}
                          onChange={(e) => updateReq(agent, 'minReputation', Number(e.target.value))}
                          className="w-full bg-surface border border-border rounded px-2 py-1 text-xs font-mono text-text focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-muted mb-1">Min Rev $</div>
                        <input
                          type="number"
                          min={0}
                          value={req.minRevenue}
                          onChange={(e) => updateReq(agent, 'minRevenue', Number(e.target.value))}
                          className="w-full bg-surface border border-border rounded px-2 py-1 text-xs font-mono text-text focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-muted mb-1">Max $</div>
                        <input
                          type="number"
                          min={0.5}
                          max={budget}
                          step={0.5}
                          value={req.maxBudget}
                          onChange={(e) => updateReq(agent, 'maxBudget', Number(e.target.value))}
                          className="w-full bg-surface border border-border rounded px-2 py-1 text-xs font-mono text-text focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted">
                  These requirements are encoded into the delegation caveats.
                  Agents below threshold are blocked at the protocol level.
                </p>
              </div>
            )}
          </div>

          {/* Flask notice */}
          <div className="p-2.5 rounded-md bg-warning/10 border border-warning/20 text-xs text-warning">
            ⚠ Requires MetaMask Flask 13.5.0+ for ERC-7715 signing.{' '}
            <a href="https://metamask.io/flask/" target="_blank" rel="noopener noreferrer" className="underline">
              Get Flask →
            </a>
          </div>

          {/* Error */}
          {status === 'error' && (
            <div className="p-3 rounded-md bg-danger/10 border border-danger/30 text-xs text-danger">
              {errorMsg}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleAuthorize}
            disabled={!address || status === 'signing' || status === 'authorizing' || status === 'done'}
            className={`
              w-full py-3 rounded-md font-display font-semibold text-sm
              transition-all duration-200 flex items-center justify-center gap-2
              ${status === 'done'
                ? 'bg-success text-white'
                : status === 'signing' || status === 'authorizing'
                ? 'bg-white/20 text-white cursor-wait'
                : !address
                ? 'bg-white/[0.06] text-muted cursor-not-allowed'
                : 'bg-white hover:bg-white/90 text-black'
              }
            `}
          >
            {status === 'idle' && !address && 'Connect wallet first'}
            {status === 'idle' && address && 'Approve Authorization'}
            {status === 'signing' && (
              <>
                <Spinner />
                Waiting for MetaMask…
              </>
            )}
            {status === 'authorizing' && (
              <>
                <Spinner />
                Authorizing agents…
              </>
            )}
            {status === 'done' && '✓ Authorized'}
            {status === 'error' && (
              <>
                <span>↺</span>
                Try again
              </>
            )}
          </button>

          {/* What this does */}
          <div className="text-xs text-muted space-y-1">
            <div className="flex items-start gap-2">
              <span className="text-accent shrink-0 mt-0.5">→</span>
              <span>One MetaMask Flask signature creates an ERC-7715 authority lease on Base</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent shrink-0 mt-0.5">→</span>
              <span>Agents receive scoped sub-delegations — never your full key</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent shrink-0 mt-0.5">→</span>
              <span>Reputation gates enforce your requirements on-chain (Sepolia)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-warning shrink-0 mt-0.5">⚡</span>
              <span>Requires Base USDC for 1Shot relay fees (~$0.01 per task)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3"/>
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
