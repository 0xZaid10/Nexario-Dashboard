import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSessionStore } from '../store/session';
import { fetchAgents, healthCheck } from '../lib/api';
import AgentCard from '../components/AgentCard';
import AuthorizeModal from '../components/AuthorizeModal';
export default function DashboardView({ onNewChat }) {
    const { address, isConnected } = useAccount();
    const { session, taskHistory } = useSessionStore();
    const [agents, setAgents] = useState([]);
    const [backendOnline, setBackendOnline] = useState(null);
    const [showAuthorize, setShowAuthorize] = useState(false);
    useEffect(() => {
        healthCheck().then(setBackendOnline);
        fetchAgents().then(setAgents).catch(() => { });
    }, []);
    const completedTasks = taskHistory.filter((t) => t.status === 'completed').length;
    const totalSpent = taskHistory.reduce((sum, t) => sum + (t.totalSpent ?? 0), 0);
    const recentTasks = taskHistory.slice(0, 5);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "h-full overflow-y-auto px-6 py-6 space-y-6", children: [!isConnected ? (_jsxs("div", { className: "card p-6 text-center", children: [_jsx("h2", { className: "font-display font-semibold text-text text-base mb-1", children: "Authority Leasing for Autonomous Agents" }), _jsx("p", { className: "text-sm text-muted max-w-md mx-auto mb-4", children: "Connect MetaMask to delegate authority to an AI agent network. One approval \u2014 research, audit, and report agents work autonomously." }), _jsx("div", { className: "flex flex-wrap justify-center gap-2 text-xs text-muted", children: ['ERC-7715 permissions', 'ERC-7710 redelegation', 'On-chain reputation', 'Venice AI inference', '1Shot relay'].map((tag) => (_jsx("span", { className: "px-2 py-1 rounded-md bg-surface border border-border", children: tag }, tag))) })] })) : !session ? (_jsx("div", { className: "card p-5 border-accent/20 bg-accent/5", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-display font-semibold text-sm text-text mb-1", children: "Ready to authorize" }), _jsxs("p", { className: "text-xs text-muted", children: ["Connected as ", address?.slice(0, 6), "\u2026", address?.slice(-4), ". Set your budget and agent requirements, then approve in MetaMask."] })] }), _jsx("button", { onClick: () => setShowAuthorize(true), className: "shrink-0 px-3 py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/90 transition-colors", children: "Authorize Agents" })] }) })) : (
                    /* Active session */
                    _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(StatCard, { label: "Budget Remaining", value: `$${session.remainingUsdc.toFixed(2)}`, sub: `of $${session.budgetUsdc.toFixed(2)}`, color: "accent" }), _jsx(StatCard, { label: "Session Expires", value: formatExpiry(session.expiresAt), sub: "authority lease", color: "accent2" }), _jsx(StatCard, { label: "Agent Gates", value: String(Object.keys(session.agentRequirements ?? {}).length), sub: "reputation caveats", color: "success" })] })), taskHistory.length > 0 && (_jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(StatCard, { label: "Total Tasks", value: String(taskHistory.length), sub: "all time", color: "muted" }), _jsx(StatCard, { label: "Completed", value: String(completedTasks), sub: `${taskHistory.length > 0 ? Math.round(completedTasks / taskHistory.length * 100) : 0}% success`, color: "success" }), _jsx(StatCard, { label: "USDC Spent", value: `$${totalSpent.toFixed(4)}`, sub: "across all tasks", color: "warning" })] })), isConnected && (_jsxs("button", { onClick: onNewChat, className: "w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface border border-border hover:border-accent/30 hover:bg-accent/5 transition-all group", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.10] transition-colors", children: _jsx("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", children: _jsx("path", { d: "M7 2V12M2 7H12", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", className: "text-muted" }) }) }), _jsx("span", { className: "text-sm text-muted group-hover:text-text transition-colors", children: "Start a new task\u2026" })] }), _jsx("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", className: "text-muted group-hover:text-accent transition-colors", children: _jsx("path", { d: "M5 3L10 7L5 11", stroke: "currentColor", strokeWidth: "1.25", strokeLinecap: "round", strokeLinejoin: "round" }) })] })), recentTasks.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "font-display font-semibold text-xs text-muted uppercase tracking-wider mb-2", children: "Recent Tasks" }), _jsx("div", { className: "space-y-2", children: recentTasks.map((task) => (_jsxs("div", { className: "flex items-start gap-3 px-3 py-2.5 rounded-lg bg-surface border border-border hover:border-accent/20 transition-colors cursor-pointer", onClick: onNewChat, children: [_jsx(StatusIcon, { status: task.status }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs text-text truncate", children: task.prompt }), _jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [_jsx("span", { className: "text-xs text-muted font-mono", children: task.taskId.slice(0, 8) }), _jsx("span", { className: "text-muted", children: "\u00B7" }), _jsx("span", { className: "text-xs text-muted", children: formatTime(task.createdAt) }), (task.delegationSteps?.length ?? 0) > 0 && (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-muted", children: "\u00B7" }), _jsxs("span", { className: "text-xs text-muted", children: [task.delegationSteps?.filter(s => s.status === 'confirmed').length, " confirmations"] })] }))] })] })] }, task.taskId))) })] })), agents.length > 0 && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-display font-semibold text-xs text-muted uppercase tracking-wider", children: "Registered Agents" }), _jsxs("span", { className: "text-xs text-muted", children: [agents.length, " on-chain"] })] }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: agents.slice(0, 4).map((agent) => (_jsx(AgentCard, { agent: agent, compact: true }, agent.agentId))) })] }))] }), showAuthorize && (_jsx(AuthorizeModal, { onClose: () => setShowAuthorize(false) }))] }));
}
function StatCard({ label, value, sub, color }) {
    const valueColor = {
        accent: 'text-accent', accent2: 'text-accent2',
        success: 'text-success', warning: 'text-warning', muted: 'text-text',
    }[color] ?? 'text-text';
    return (_jsxs("div", { className: "card px-3 py-3", children: [_jsx("div", { className: "text-xs text-muted mb-1", children: label }), _jsx("div", { className: `font-display font-bold text-lg leading-none ${valueColor}`, children: value }), _jsx("div", { className: "text-xs text-muted mt-0.5", children: sub })] }));
}
function StatusIcon({ status }) {
    const config = {
        completed: { bg: 'bg-success/15', icon: '✓', color: 'text-success' },
        failed: { bg: 'bg-danger/15', icon: '✗', color: 'text-danger' },
        running: { bg: 'bg-accent/15', icon: '…', color: 'text-accent' },
    }[status] ?? { bg: 'bg-border', icon: '·', color: 'text-muted' };
    return (_jsx("div", { className: `w-5 h-5 rounded-full ${config.bg} flex items-center justify-center text-xs ${config.color} shrink-0 mt-0.5 font-bold`, children: config.icon }));
}
function formatExpiry(expiresAt) {
    const diff = expiresAt - Math.floor(Date.now() / 1000);
    if (diff <= 0)
        return 'Expired';
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function formatTime(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000)
        return 'just now';
    if (diff < 3600000)
        return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000)
        return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
}
