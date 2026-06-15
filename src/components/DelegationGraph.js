import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import DelegationNode from './DelegationNode';
export default function DelegationGraph({ steps, taskId }) {
    if (steps.length === 0)
        return null;
    // Separate coordinator (root) from sub-agents
    const coordinator = steps.find((s) => s.agentName.toLowerCase() === 'coordinator');
    const subAgents = steps.filter((s) => s.agentName.toLowerCase() !== 'coordinator');
    // User is always the implicit root
    const userStep = {
        stepId: 'user',
        agentName: 'user',
        agentId: 0,
        status: 'confirmed',
    };
    return (_jsxs("div", { className: "p-3 rounded-lg bg-bg border border-border animate-fade-in", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" }), _jsx("span", { className: "text-xs font-medium text-muted uppercase tracking-wider", children: "Delegation Chain" }), _jsx("span", { className: "text-xs font-mono text-muted ml-auto", children: taskId.slice(0, 8) })] }), _jsxs("div", { className: "flex flex-col items-center gap-0", children: [_jsx(DelegationNode, { step: userStep, isRoot: true }), _jsx(Connector, { active: !!coordinator }), coordinator && (_jsxs(_Fragment, { children: [_jsx(DelegationNode, { step: coordinator }), subAgents.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "relative w-full flex justify-center", children: _jsx(BranchConnector, { count: subAgents.length }) }), _jsx("div", { className: "flex gap-3 flex-wrap justify-center", children: subAgents.map((step) => (_jsx(DelegationNode, { step: step }, step.stepId))) })] }))] })), !coordinator && steps.length > 0 && (_jsxs("div", { className: "flex items-center gap-2 py-2 text-xs text-muted", children: [_jsx("div", { className: "dot-active" }), _jsx("span", { children: "Coordinator planning\u2026" })] }))] }), _jsx(SummaryRow, { steps: steps })] }));
}
function Connector({ active }) {
    return (_jsxs("div", { className: "flex flex-col items-center py-1", children: [_jsx("div", { className: `w-px h-5 transition-colors duration-500 ${active ? 'bg-accent' : 'bg-border'}` }), _jsx("div", { className: `w-1.5 h-1.5 rotate-45 border-r border-b transition-colors duration-500 ${active ? 'border-accent' : 'border-border'}` })] }));
}
function BranchConnector({ count }) {
    if (count === 0)
        return null;
    if (count === 1)
        return _jsx(Connector, { active: true });
    // For 2+ sub-agents: draw horizontal spread + vertical drops
    return (_jsxs("div", { className: "flex flex-col items-center w-full py-1", style: { minWidth: count * 172 }, children: [_jsx("div", { className: "w-px h-3 bg-accent" }), _jsx("div", { className: "w-full h-px bg-accent", style: { maxWidth: (count - 1) * 172 } }), _jsx("div", { className: "flex w-full justify-around", style: { maxWidth: (count - 1) * 172 + 172 }, children: Array.from({ length: count }).map((_, i) => (_jsx("div", { className: "w-px h-3 bg-accent" }, i))) })] }));
}
function SummaryRow({ steps }) {
    const confirmed = steps.filter((s) => s.status === 'confirmed').length;
    const blocked = steps.filter((s) => s.status === 'blocked').length;
    const failed = steps.filter((s) => s.status === 'failed').length;
    const total = steps.length;
    if (total === 0)
        return null;
    const totalSpent = steps.reduce((sum, s) => sum + (s.budgetUsed ?? 0), 0);
    return (_jsxs("div", { className: "flex items-center gap-3 mt-3 pt-2.5 border-t border-border text-xs", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-success" }), _jsxs("span", { className: "text-muted", children: [confirmed, " confirmed"] })] }), blocked > 0 && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-danger" }), _jsxs("span", { className: "text-muted", children: [blocked, " blocked"] })] })), failed > 0 && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-danger" }), _jsxs("span", { className: "text-muted", children: [failed, " failed"] })] })), totalSpent > 0 && (_jsxs("div", { className: "ml-auto font-mono text-muted", children: ["$", totalSpent.toFixed(4), " spent"] }))] }));
}
