import { useAccount } from 'wagmi'
import { useSessionStore } from '../store/session'
import type { Agent } from '../lib/api'

interface Props {
  agent: Agent
  onDelegate?: (agent: Agent) => void
  compact?: boolean
  showPreferenceToggle?: boolean
}

const CAPABILITY_COLORS: Record<string, string> = {
  research:     'bg-accent2/15 text-accent2',
  audit:        'bg-warning/15 text-warning',
  report:       'bg-success/15 text-success',
  coordinate:   'bg-accent/15 text-accent',
  tee:          'bg-accent2/15 text-accent2',
  legal:        'bg-warning/15 text-warning',
  intelligence: 'bg-danger/15 text-danger',
  reflection:   'bg-muted/15 text-muted',
  A2A:          'bg-muted/15 text-muted',
}

export default function AgentCard({ agent, onDelegate, compact = false, showPreferenceToggle = true }: Props) {
  const { address } = useAccount()
  const { preferredAgentIds, addPreferredAgent, removePreferredAgent, activeChatId } = useSessionStore()
  const isPreferred = preferredAgentIds.includes(agent.agentId)
  const isOwnedByUser = address && agent.owner?.toLowerCase() === address.toLowerCase()

  const rep = agent.reputation?.successRate ?? agent.reputationScore ?? 0
  const repColor = rep >= 80 ? 'text-success' : rep >= 60 ? 'text-warning' : 'text-danger'
  const repBg = rep >= 80 ? 'bg-success/10' : rep >= 60 ? 'bg-warning/10' : 'bg-danger/10'

  function togglePreferred() {
    if (isPreferred) removePreferredAgent(activeChatId ?? '', agent.agentId)
    else addPreferredAgent(activeChatId ?? '', agent.agentId)
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-2.5 py-2 rounded-md bg-bg border transition-colors ${
        isPreferred ? 'border-accent/40 bg-accent/5' : 'border-border hover:border-accent/30'
      }`}>
        <AgentAvatar name={agent.name} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-text truncate">{agent.name}</div>
          <div className="text-xs text-muted">agentId #{agent.agentId}</div>
        </div>
        <div className={`text-xs font-mono font-semibold ${repColor}`}>{rep.toFixed(0)}</div>
        {showPreferenceToggle && (
          <button
            onClick={togglePreferred}
            className={`w-4 h-4 rounded border transition-colors shrink-0 ${
              isPreferred ? 'bg-accent border-accent' : 'border-border'
            }`}
          />
        )}
      </div>
    )
  }

  return (
    <div className={`card p-4 transition-all group ${
      isPreferred ? 'border-accent/40 bg-accent/5' : 'hover:border-accent/20'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <AgentAvatar name={agent.name} />
          <div>
            <h3 className="font-display font-semibold text-sm text-text group-hover:text-accent transition-colors">
              {agent.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted">#{agent.agentId}</span>
              <span className="text-muted">·</span>
              <span className="addr truncate max-w-[100px]">
                {(agent.wallet ?? '').slice(0, 6)}…{(agent.wallet ?? '').slice(-4)}
              </span>
              {isOwnedByUser && (
                <span className="text-xs text-accent2 font-medium">· yours</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className={`px-2 py-1 rounded-md ${repBg}`}>
            <div className={`font-mono font-bold text-base leading-none ${repColor}`}>
              {rep.toFixed(0)}
            </div>
            <div className="text-xs text-muted mt-0.5 text-center">rep</div>
          </div>

          {/* TEE badge */}
          {(agent as any).isTEE && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-accent2/15 text-accent2">🔒 TEE</span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted mb-3 leading-relaxed line-clamp-2">
        {agent.description}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-3 text-xs">
        <div>
          <span className="text-muted">Tasks: </span>
          <span className="font-mono text-text">{agent.reputation?.taskCount ?? 0}</span>
        </div>
        <div>
          <span className="text-muted">Revenue: </span>
          <span className="font-mono text-text">${(agent.reputation?.totalRevenue ?? 0).toFixed(2)}</span>
        </div>
        {agent.x402Support && (
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-1 h-1 rounded-full bg-accent2" />
            <span className="text-accent2">x402</span>
          </div>
        )}
      </div>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-1 mb-3">
        {(agent.capabilities ?? []).slice(0, 5).map((cap) => (
          <span key={cap} className={`px-1.5 py-0.5 rounded text-xs font-medium ${
            CAPABILITY_COLORS[cap] ?? 'bg-border text-muted'
          }`}>
            {cap}
          </span>
        ))}
      </div>

      {/* Venice model */}
      {(agent as any).veniceModel && (
        <div className="text-xs text-muted mb-3 font-mono truncate">
          Venice: {(agent as any).veniceModel}
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center gap-2">
        {/* Use for my tasks toggle */}
        {showPreferenceToggle && (
          <button
            onClick={togglePreferred}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex-1 justify-center ${
              isPreferred
                ? 'bg-white text-black'
                : 'bg-surface border border-border text-muted hover:text-text hover:border-white/20'
            }`}
          >
            <span>{isPreferred ? '✓' : '+'}</span>
            <span>{isPreferred ? 'Preferred agent' : 'Use for my tasks'}</span>
          </button>
        )}

        {onDelegate && (
          <button
            onClick={() => onDelegate(agent)}
            className="px-2.5 py-1.5 rounded-md bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition-colors"
          >
            Delegate
          </button>
        )}
      </div>
    </div>
  )
}

function AgentAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const colors = [
    'bg-accent/20 text-accent',
    'bg-accent2/20 text-accent2',
    'bg-success/20 text-success',
    'bg-warning/20 text-warning',
  ]
  const colorIdx = name.charCodeAt(0) % colors.length
  const initial = name.slice(0, 2).toUpperCase()
  const sz = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'

  return (
    <div className={`${sz} rounded-md flex items-center justify-center font-display font-bold ${colors[colorIdx]}`}>
      {initial}
    </div>
  )
}
