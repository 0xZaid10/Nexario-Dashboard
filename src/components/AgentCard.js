import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAccount } from 'wagmi';
import { useSessionStore } from '../store/session';
const CAPABILITY_COLORS = {
    research: 'bg-accent2/15 text-accent2',
    audit: 'bg-warning/15 text-warning',
    report: 'bg-success/15 text-success',
    coordinate: 'bg-accent/15 text-accent',
    tee: 'bg-accent2/15 text-accent2',
    legal: 'bg-warning/15 text-warning',
    intelligence: 'bg-danger/15 text-danger',
    reflection: 'bg-muted/15 text-muted',
    A2A: 'bg-muted/15 text-muted',
};
export default function AgentCard({ agent, onDelegate, compact = false, showPreferenceToggle = true }) {
    const { address } = useAccount();
    const { preferredAgentIds, addPreferredAgent, removePreferredAgent, activeChatId } = useSessionStore();
    const isPreferred = preferredAgentIds.includes(agent.agentId);
    const isOwnedByUser = address && agent.owner?.toLowerCase() === address.toLowerCase();
    const rep = agent.reputation?.successRate ?? agent.reputationScore ?? 0;
    const repColor = rep >= 80 ? 'text-success' : rep >= 60 ? 'text-warning' : 'text-danger';
    const repBg = rep >= 80 ? 'bg-success/10' : rep >= 60 ? 'bg-warning/10' : 'bg-danger/10';
    function togglePreferred() {
        if (isPreferred)
            removePreferredAgent(activeChatId ?? '', agent.agentId);
        else
            addPreferredAgent(activeChatId ?? '', agent.agentId);
    }
    if (compact) {
        return (_jsxs("div", { className: `flex items-center gap-2 px-2.5 py-2 rounded-md bg-bg border transition-colors ${isPreferred ? 'border-accent/40 bg-accent/5' : 'border-border hover:border-accent/30'}`, children: [_jsx(AgentAvatar, { name: agent.name, size: "sm" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-xs font-medium text-text truncate", children: agent.name }), _jsxs("div", { className: "text-xs text-muted", children: ["agentId #", agent.agentId] })] }), _jsx("div", { className: `text-xs font-mono font-semibold ${repColor}`, children: rep.toFixed(0) }), showPreferenceToggle && (_jsx("button", { onClick: togglePreferred, className: `w-4 h-4 rounded border transition-colors shrink-0 ${isPreferred ? 'bg-accent border-accent' : 'border-border'}` }))] }));
    }
    return (_jsxs("div", { className: `card p-4 transition-all group ${isPreferred ? 'border-accent/40 bg-accent/5' : 'hover:border-accent/20'}`, children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-3", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx(AgentAvatar, { name: agent.name }), _jsxs("div", { children: [_jsx("h3", { className: "font-display font-semibold text-sm text-text group-hover:text-accent transition-colors", children: agent.name }), _jsxs("div", { className: "flex items-center gap-1.5 mt-0.5", children: [_jsxs("span", { className: "text-xs text-muted", children: ["#", agent.agentId] }), _jsx("span", { className: "text-muted", children: "\u00B7" }), _jsxs("span", { className: "addr truncate max-w-[100px]", children: [(agent.wallet ?? '').slice(0, 6), "\u2026", (agent.wallet ?? '').slice(-4)] }), isOwnedByUser && (_jsx("span", { className: "text-xs text-accent2 font-medium", children: "\u00B7 yours" }))] })] })] }), _jsxs("div", { className: "flex flex-col items-end gap-1.5 shrink-0", children: [_jsxs("div", { className: `px-2 py-1 rounded-md ${repBg}`, children: [_jsx("div", { className: `font-mono font-bold text-base leading-none ${repColor}`, children: rep.toFixed(0) }), _jsx("div", { className: "text-xs text-muted mt-0.5 text-center", children: "rep" })] }), agent.isTEE && (_jsx("span", { className: "text-xs px-1.5 py-0.5 rounded bg-accent2/15 text-accent2", children: "\uD83D\uDD12 TEE" }))] })] }), _jsx("p", { className: "text-xs text-muted mb-3 leading-relaxed line-clamp-2", children: agent.description }), _jsxs("div", { className: "flex items-center gap-3 mb-3 text-xs", children: [_jsxs("div", { children: [_jsx("span", { className: "text-muted", children: "Tasks: " }), _jsx("span", { className: "font-mono text-text", children: agent.reputation?.taskCount ?? 0 })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted", children: "Revenue: " }), _jsxs("span", { className: "font-mono text-text", children: ["$", (agent.reputation?.totalRevenue ?? 0).toFixed(2)] })] }), agent.x402Support && (_jsxs("div", { className: "flex items-center gap-1 ml-auto", children: [_jsx("div", { className: "w-1 h-1 rounded-full bg-accent2" }), _jsx("span", { className: "text-accent2", children: "x402" })] }))] }), _jsx("div", { className: "flex flex-wrap gap-1 mb-3", children: (agent.capabilities ?? []).slice(0, 5).map((cap) => (_jsx("span", { className: `px-1.5 py-0.5 rounded text-xs font-medium ${CAPABILITY_COLORS[cap] ?? 'bg-border text-muted'}`, children: cap }, cap))) }), agent.veniceModel && (_jsxs("div", { className: "text-xs text-muted mb-3 font-mono truncate", children: ["Venice: ", agent.veniceModel] })), _jsxs("div", { className: "flex items-center gap-2", children: [showPreferenceToggle && (_jsxs("button", { onClick: togglePreferred, className: `flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex-1 justify-center ${isPreferred
                            ? 'bg-white text-black'
                            : 'bg-surface border border-border text-muted hover:text-text hover:border-white/20'}`, children: [_jsx("span", { children: isPreferred ? '✓' : '+' }), _jsx("span", { children: isPreferred ? 'Preferred agent' : 'Use for my tasks' })] })), onDelegate && (_jsx("button", { onClick: () => onDelegate(agent), className: "px-2.5 py-1.5 rounded-md bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition-colors", children: "Delegate" }))] })] }));
}
function AgentAvatar({ name, size = 'md' }) {
    const colors = [
        'bg-accent/20 text-accent',
        'bg-accent2/20 text-accent2',
        'bg-success/20 text-success',
        'bg-warning/20 text-warning',
    ];
    const colorIdx = name.charCodeAt(0) % colors.length;
    const initial = name.slice(0, 2).toUpperCase();
    const sz = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
    return (_jsx("div", { className: `${sz} rounded-md flex items-center justify-center font-display font-bold ${colors[colorIdx]}`, children: initial }));
}
