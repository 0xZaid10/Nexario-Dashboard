import type { DelegationStep } from '../store/session'

interface Props {
  step: DelegationStep
  isRoot?: boolean
}

const STATUS_CONFIG = {
  pending:    { dot: 'bg-muted',    label: 'Pending',    ring: 'border-border' },
  planning:   { dot: 'dot-active',  label: 'Planning',   ring: 'border-accent/40' },
  delegating: { dot: 'dot-active',  label: 'Delegating', ring: 'border-accent/40' },
  executing:  { dot: 'dot-active',  label: 'Executing',  ring: 'border-accent2/40' },
  confirmed:  { dot: 'dot-success', label: 'Confirmed',  ring: 'border-success/40' },
  blocked:    { dot: 'bg-danger',   label: 'Blocked',    ring: 'border-danger/40' },
  failed:     { dot: 'bg-danger',   label: 'Failed',     ring: 'border-danger/40' },
} as const

const AGENT_COLORS: Record<string, string> = {
  coordinator: 'text-accent',
  research:    'text-accent2',
  audit:       'text-warning',
  report:      'text-success',
  user:        'text-text',
}

export default function DelegationNode({ step, isRoot }: Props) {
  const config = STATUS_CONFIG[step.status] ?? STATUS_CONFIG.pending
  const nameColor = AGENT_COLORS[step.agentName.toLowerCase()] ?? 'text-text'
  const isBlocked = step.status === 'blocked'
  const isConfirmed = step.status === 'confirmed'
  const isActive = step.status === 'executing' || step.status === 'delegating' || step.status === 'planning'

  return (
    <div className={`
      relative flex flex-col gap-1.5 p-3 rounded-lg border transition-all duration-300
      ${isRoot ? 'bg-surface border-border' : 'bg-bg border-border'}
      ${isActive ? `${config.ring} glow-accent` : config.ring}
      ${isConfirmed ? 'glow-success' : ''}
      ${isBlocked ? 'border-danger/40 bg-danger/5' : ''}
      min-w-[160px]
    `}>
      {/* Agent name + status */}
      <div className="flex items-center justify-between gap-2">
        <span className={`font-display font-semibold text-xs capitalize ${nameColor}`}>
          {isRoot ? '👤 User' : step.agentName}
        </span>
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
          <span className="text-xs text-muted">{config.label}</span>
        </div>
      </div>

      {/* Reputation score */}
      {step.reputationScore !== undefined && !isRoot && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted">Rep:</span>
          <span className={`text-xs font-mono font-medium ${
            step.reputationScore >= 80 ? 'text-success' :
            step.reputationScore >= 60 ? 'text-warning' : 'text-danger'
          }`}>
            {step.reputationScore.toFixed(0)}
          </span>
          <span className="text-xs text-muted">/ 100</span>
        </div>
      )}

      {/* Budget */}
      {step.budgetAllocated !== undefined && !isRoot && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted">Budget:</span>
          <span className="text-xs font-mono text-text">
            ${step.budgetAllocated.toFixed(2)}
            {step.budgetUsed !== undefined && (
              <span className="text-muted"> / ${step.budgetUsed.toFixed(2)} used</span>
            )}
          </span>
        </div>
      )}

      {/* Tx hash */}
      {step.txHash && (
        <a
          href={`https://etherscan.io/tx/${step.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 group"
          title={step.txHash}
        >
          <span className="text-xs font-mono text-muted group-hover:text-accent transition-colors truncate max-w-[120px]">
            {step.txHash.slice(0, 10)}…{step.txHash.slice(-6)}
          </span>
          <span className="text-xs text-muted group-hover:text-accent transition-colors">↗</span>
        </a>
      )}

      {/* Blocked message */}
      {isBlocked && step.errorMessage && (
        <div className="text-xs text-danger mt-0.5">
          {step.errorMessage}
        </div>
      )}

      {/* Active pulse ring */}
      {isActive && (
        <div className="absolute inset-0 rounded-lg border border-accent/20 animate-pulse-slow pointer-events-none" />
      )}
    </div>
  )
}
