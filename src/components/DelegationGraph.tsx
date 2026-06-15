import DelegationNode from './DelegationNode'
import type { DelegationStep } from '../store/session'

interface Props {
  steps: DelegationStep[]
  taskId: string
}

export default function DelegationGraph({ steps, taskId }: Props) {
  if (steps.length === 0) return null

  // Separate coordinator (root) from sub-agents
  const coordinator = steps.find((s) =>
    s.agentName.toLowerCase() === 'coordinator'
  )
  const subAgents = steps.filter((s) =>
    s.agentName.toLowerCase() !== 'coordinator'
  )

  // User is always the implicit root
  const userStep: DelegationStep = {
    stepId: 'user',
    agentName: 'user',
    agentId: 0,
    status: 'confirmed',
  }

  return (
    <div className="p-3 rounded-lg bg-bg border border-border animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />
        <span className="text-xs font-medium text-muted uppercase tracking-wider">
          Delegation Chain
        </span>
        <span className="text-xs font-mono text-muted ml-auto">
          {taskId.slice(0, 8)}
        </span>
      </div>

      {/* Graph layout: User → Coordinator → [sub-agents] */}
      <div className="flex flex-col items-center gap-0">

        {/* User node */}
        <DelegationNode step={userStep} isRoot />

        {/* Connector to coordinator */}
        <Connector active={!!coordinator} />

        {/* Coordinator node */}
        {coordinator && (
          <>
            <DelegationNode step={coordinator} />

            {/* Sub-agents row */}
            {subAgents.length > 0 && (
              <>
                {/* Branch lines */}
                <div className="relative w-full flex justify-center">
                  <BranchConnector count={subAgents.length} />
                </div>

                {/* Sub-agent nodes */}
                <div className="flex gap-3 flex-wrap justify-center">
                  {subAgents.map((step) => (
                    <DelegationNode key={step.stepId} step={step} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* If no coordinator yet, show planning state */}
        {!coordinator && steps.length > 0 && (
          <div className="flex items-center gap-2 py-2 text-xs text-muted">
            <div className="dot-active" />
            <span>Coordinator planning…</span>
          </div>
        )}
      </div>

      {/* Summary row */}
      <SummaryRow steps={steps} />
    </div>
  )
}

function Connector({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className={`w-px h-5 transition-colors duration-500 ${
        active ? 'bg-accent' : 'bg-border'
      }`} />
      <div className={`w-1.5 h-1.5 rotate-45 border-r border-b transition-colors duration-500 ${
        active ? 'border-accent' : 'border-border'
      }`} />
    </div>
  )
}

function BranchConnector({ count }: { count: number }) {
  if (count === 0) return null
  if (count === 1) return <Connector active />

  // For 2+ sub-agents: draw horizontal spread + vertical drops
  return (
    <div className="flex flex-col items-center w-full py-1" style={{ minWidth: count * 172 }}>
      <div className="w-px h-3 bg-accent" />
      <div className="w-full h-px bg-accent" style={{ maxWidth: (count - 1) * 172 }} />
      <div className="flex w-full justify-around" style={{ maxWidth: (count - 1) * 172 + 172 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-px h-3 bg-accent" />
        ))}
      </div>
    </div>
  )
}

function SummaryRow({ steps }: { steps: DelegationStep[] }) {
  const confirmed = steps.filter((s) => s.status === 'confirmed').length
  const blocked = steps.filter((s) => s.status === 'blocked').length
  const failed = steps.filter((s) => s.status === 'failed').length
  const total = steps.length

  if (total === 0) return null

  const totalSpent = steps.reduce((sum, s) => sum + (s.budgetUsed ?? 0), 0)

  return (
    <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-border text-xs">
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-success" />
        <span className="text-muted">{confirmed} confirmed</span>
      </div>
      {blocked > 0 && (
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-danger" />
          <span className="text-muted">{blocked} blocked</span>
        </div>
      )}
      {failed > 0 && (
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-danger" />
          <span className="text-muted">{failed} failed</span>
        </div>
      )}
      {totalSpent > 0 && (
        <div className="ml-auto font-mono text-muted">
          ${totalSpent.toFixed(4)} spent
        </div>
      )}
    </div>
  )
}
