import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const STATUS_CONFIG = {
    pending: { dot: 'bg-muted', label: 'Pending', ring: 'border-border' },
    planning: { dot: 'dot-active', label: 'Planning', ring: 'border-accent/40' },
    delegating: { dot: 'dot-active', label: 'Delegating', ring: 'border-accent/40' },
    executing: { dot: 'dot-active', label: 'Executing', ring: 'border-accent2/40' },
    confirmed: { dot: 'dot-success', label: 'Confirmed', ring: 'border-success/40' },
    blocked: { dot: 'bg-danger', label: 'Blocked', ring: 'border-danger/40' },
    failed: { dot: 'bg-danger', label: 'Failed', ring: 'border-danger/40' },
};
const AGENT_COLORS = {
    coordinator: 'text-accent',
    research: 'text-accent2',
    audit: 'text-warning',
    report: 'text-success',
    user: 'text-text',
};
export default function DelegationNode({ step, isRoot }) {
    const config = STATUS_CONFIG[step.status] ?? STATUS_CONFIG.pending;
    const nameColor = AGENT_COLORS[step.agentName.toLowerCase()] ?? 'text-text';
    const isBlocked = step.status === 'blocked';
    const isConfirmed = step.status === 'confirmed';
    const isActive = step.status === 'executing' || step.status === 'delegating' || step.status === 'planning';
    return (_jsxs("div", { className: `
      relative flex flex-col gap-1.5 p-3 rounded-lg border transition-all duration-300
      ${isRoot ? 'bg-surface border-border' : 'bg-bg border-border'}
      ${isActive ? `${config.ring} glow-accent` : config.ring}
      ${isConfirmed ? 'glow-success' : ''}
      ${isBlocked ? 'border-danger/40 bg-danger/5' : ''}
      min-w-[160px]
    `, children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: `font-display font-semibold text-xs capitalize ${nameColor}`, children: isRoot ? '👤 User' : step.agentName }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: `w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}` }), _jsx("span", { className: "text-xs text-muted", children: config.label })] })] }), step.reputationScore !== undefined && !isRoot && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "text-xs text-muted", children: "Rep:" }), _jsx("span", { className: `text-xs font-mono font-medium ${step.reputationScore >= 80 ? 'text-success' :
                            step.reputationScore >= 60 ? 'text-warning' : 'text-danger'}`, children: step.reputationScore.toFixed(0) }), _jsx("span", { className: "text-xs text-muted", children: "/ 100" })] })), step.budgetAllocated !== undefined && !isRoot && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "text-xs text-muted", children: "Budget:" }), _jsxs("span", { className: "text-xs font-mono text-text", children: ["$", step.budgetAllocated.toFixed(2), step.budgetUsed !== undefined && (_jsxs("span", { className: "text-muted", children: [" / $", step.budgetUsed.toFixed(2), " used"] }))] })] })), step.txHash && (_jsxs("a", { href: `https://etherscan.io/tx/${step.txHash}`, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1 group", title: step.txHash, children: [_jsxs("span", { className: "text-xs font-mono text-muted group-hover:text-accent transition-colors truncate max-w-[120px]", children: [step.txHash.slice(0, 10), "\u2026", step.txHash.slice(-6)] }), _jsx("span", { className: "text-xs text-muted group-hover:text-accent transition-colors", children: "\u2197" })] })), isBlocked && step.errorMessage && (_jsx("div", { className: "text-xs text-danger mt-0.5", children: step.errorMessage })), isActive && (_jsx("div", { className: "absolute inset-0 rounded-lg border border-accent/20 animate-pulse-slow pointer-events-none" }))] }));
}
