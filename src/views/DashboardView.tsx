import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useSessionStore } from '../store/session'
import { fetchAgents, healthCheck } from '../lib/api'
import type { Agent } from '../lib/api'
import AgentCard from '../components/AgentCard'
import AuthorizeModal from '../components/AuthorizeModal'

interface Props {
  onNewChat: () => void
}

export default function DashboardView({ onNewChat }: Props) {
  const { address, isConnected } = useAccount()
  const { session, taskHistory } = useSessionStore()
  const [agents, setAgents] = useState<Agent[]>([])
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [showAuthorize, setShowAuthorize] = useState(false)

  useEffect(() => {
    healthCheck().then(setBackendOnline)
    fetchAgents().then(setAgents).catch(() => {})
  }, [])

  const completedTasks = taskHistory.filter((t) => t.status === 'completed').length
  const totalSpent = taskHistory.reduce((sum, t) => sum + (t.totalSpent ?? 0), 0)
  const recentTasks = taskHistory.slice(0, 5)

  return (
    <>
      <div className="h-full overflow-y-auto px-6 py-6 space-y-6">

        {/* Hero — connect or session state */}
        {!isConnected ? (
          <div className="card p-6 text-center">
            <h2 className="font-display font-semibold text-text text-base mb-1">
              Authority Leasing for Autonomous Agents
            </h2>
            <p className="text-sm text-muted max-w-md mx-auto mb-4">
              Connect MetaMask to delegate authority to an AI agent network.
              One approval — research, audit, and report agents work autonomously.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted">
              {['ERC-7715 permissions', 'ERC-7710 redelegation', 'On-chain reputation', 'Venice AI inference', '1Shot relay'].map((tag) => (
                <span key={tag} className="px-2 py-1 rounded-md bg-surface border border-border">{tag}</span>
              ))}
            </div>
          </div>
        ) : !session ? (
          <div className="card p-5 border-accent/20 bg-accent/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold text-sm text-text mb-1">
                  Ready to authorize
                </h3>
                <p className="text-xs text-muted">
                  Connected as {address?.slice(0, 6)}…{address?.slice(-4)}.
                  Set your budget and agent requirements, then approve in MetaMask.
                </p>
              </div>
              <button
                onClick={() => setShowAuthorize(true)}
                className="shrink-0 px-3 py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/90 transition-colors"
              >
                Authorize Agents
              </button>
            </div>
          </div>
        ) : (
          /* Active session */
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Budget Remaining"
              value={`$${session.remainingUsdc.toFixed(2)}`}
              sub={`of $${session.budgetUsdc.toFixed(2)}`}
              color="accent"
            />
            <StatCard
              label="Session Expires"
              value={formatExpiry(session.expiresAt)}
              sub="authority lease"
              color="accent2"
            />
            <StatCard
              label="Agent Gates"
              value={String(Object.keys(session.agentRequirements ?? {}).length)}
              sub="reputation caveats"
              color="success"
            />
          </div>
        )}

        {/* Quick stats */}
        {taskHistory.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total Tasks" value={String(taskHistory.length)} sub="all time" color="muted" />
            <StatCard label="Completed" value={String(completedTasks)} sub={`${taskHistory.length > 0 ? Math.round(completedTasks / taskHistory.length * 100) : 0}% success`} color="success" />
            <StatCard label="USDC Spent" value={`$${totalSpent.toFixed(4)}`} sub="across all tasks" color="warning" />
          </div>
        )}

        {/* New task CTA */}
        {isConnected && (
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface border border-border hover:border-accent/30 hover:bg-accent/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.10] transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted"/>
                </svg>
              </div>
              <span className="text-sm text-muted group-hover:text-text transition-colors">
                Start a new task…
              </span>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-muted group-hover:text-accent transition-colors">
              <path d="M5 3L10 7L5 11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Recent tasks */}
        {recentTasks.length > 0 && (
          <div>
            <h3 className="font-display font-semibold text-xs text-muted uppercase tracking-wider mb-2">
              Recent Tasks
            </h3>
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <div
                  key={task.taskId}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-surface border border-border hover:border-accent/20 transition-colors cursor-pointer"
                  onClick={onNewChat}
                >
                  <StatusIcon status={task.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text truncate">{task.prompt}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted font-mono">{task.taskId.slice(0, 8)}</span>
                      <span className="text-muted">·</span>
                      <span className="text-xs text-muted">{formatTime(task.createdAt)}</span>
                      {(task.delegationSteps?.length ?? 0) > 0 && (
                        <>
                          <span className="text-muted">·</span>
                          <span className="text-xs text-muted">
                            {task.delegationSteps?.filter(s => s.status === 'confirmed').length} confirmations
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent registry preview */}
        {agents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-semibold text-xs text-muted uppercase tracking-wider">
                Registered Agents
              </h3>
              <span className="text-xs text-muted">{agents.length} on-chain</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {agents.slice(0, 4).map((agent) => (
                <AgentCard key={agent.agentId} agent={agent} compact />
              ))}
            </div>
          </div>
        )}
      </div>

      {showAuthorize && (
        <AuthorizeModal onClose={() => setShowAuthorize(false)} />
      )}
    </>
  )
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: string
}) {
  const valueColor = {
    accent: 'text-accent', accent2: 'text-accent2',
    success: 'text-success', warning: 'text-warning', muted: 'text-text',
  }[color] ?? 'text-text'

  return (
    <div className="card px-3 py-3">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className={`font-display font-bold text-lg leading-none ${valueColor}`}>{value}</div>
      <div className="text-xs text-muted mt-0.5">{sub}</div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  const config = {
    completed: { bg: 'bg-success/15', icon: '✓', color: 'text-success' },
    failed:    { bg: 'bg-danger/15',  icon: '✗', color: 'text-danger' },
    running:   { bg: 'bg-accent/15',  icon: '…', color: 'text-accent' },
  }[status] ?? { bg: 'bg-border', icon: '·', color: 'text-muted' }

  return (
    <div className={`w-5 h-5 rounded-full ${config.bg} flex items-center justify-center text-xs ${config.color} shrink-0 mt-0.5 font-bold`}>
      {config.icon}
    </div>
  )
}

function formatExpiry(expiresAt: number): string {
  const diff = expiresAt - Math.floor(Date.now() / 1000)
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString()
}
