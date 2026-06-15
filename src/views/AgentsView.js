import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { fetchAgents } from '../lib/api';
import AgentCard from '../components/AgentCard';
const CAPABILITY_FILTERS = ['all', 'research', 'audit', 'report', 'coordinate', 'A2A'];
export default function AgentsView() {
    const { address } = useAccount();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('reputation');
    const [search, setSearch] = useState('');
    useEffect(() => {
        fetchAgents()
            .then(setAgents)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);
    const filtered = agents
        .filter((a) => {
        if (filter !== 'all' && !a.capabilities.includes(filter))
            return false;
        if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
            !a.description.toLowerCase().includes(search.toLowerCase()))
            return false;
        return true;
    })
        .sort((a, b) => {
        if (sortBy === 'reputation')
            return (b.reputation?.successRate ?? 0) - (a.reputation?.successRate ?? 0);
        if (sortBy === 'revenue')
            return (b.reputation?.totalRevenue ?? 0) - (a.reputation?.totalRevenue ?? 0);
        return (b.reputation?.taskCount ?? 0) - (a.reputation?.taskCount ?? 0);
    });
    return (_jsxs("div", { className: "h-full overflow-y-auto px-6 py-5", children: [_jsx("div", { className: "flex items-center justify-between mb-5", children: _jsxs("div", { children: [_jsx("h2", { className: "font-display font-semibold text-text text-base", children: "Agent Registry" }), _jsxs("p", { className: "text-xs text-muted mt-0.5", children: [agents.length, " agents registered on-chain \u00B7 ERC-8004 identities"] })] }) }), _jsxs("div", { className: "flex items-center gap-3 mb-4 flex-wrap", children: [_jsxs("div", { className: "relative", children: [_jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search agents\u2026", className: "pl-7 pr-3 py-1.5 bg-surface border border-border rounded-md text-xs text-text placeholder-muted focus:outline-none focus:border-accent/50 w-44" }), _jsxs("svg", { className: "absolute left-2 top-1/2 -translate-y-1/2 text-muted", width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: [_jsx("circle", { cx: "5", cy: "5", r: "3.5", stroke: "currentColor", strokeWidth: "1" }), _jsx("path", { d: "M8 8L10.5 10.5", stroke: "currentColor", strokeWidth: "1", strokeLinecap: "round" })] })] }), _jsx("div", { className: "flex gap-1 flex-wrap", children: CAPABILITY_FILTERS.map((cap) => (_jsx("button", { onClick: () => setFilter(cap), className: `px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize ${filter === cap
                                ? 'bg-white text-black'
                                : 'bg-surface border border-border text-muted hover:text-text hover:border-white/20'}`, children: cap }, cap))) }), _jsxs("div", { className: "ml-auto flex items-center gap-1.5", children: [_jsx("span", { className: "text-xs text-muted", children: "Sort:" }), ['reputation', 'revenue', 'tasks'].map((s) => (_jsx("button", { onClick: () => setSortBy(s), className: `px-2 py-1 rounded text-xs capitalize transition-colors ${sortBy === s ? 'text-white font-medium' : 'text-muted hover:text-text'}`, children: s }, s)))] })] }), loading ? (_jsx("div", { className: "grid grid-cols-2 gap-3", children: Array.from({ length: 4 }).map((_, i) => (_jsxs("div", { className: "card p-4 animate-pulse", children: [_jsxs("div", { className: "flex items-center gap-2.5 mb-3", children: [_jsx("div", { className: "w-8 h-8 rounded-md bg-border" }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "w-24 h-3 rounded bg-border" }), _jsx("div", { className: "w-16 h-2 rounded bg-border" })] })] }), _jsx("div", { className: "w-full h-2 rounded bg-border mb-2" }), _jsx("div", { className: "w-3/4 h-2 rounded bg-border" })] }, i))) })) : filtered.length === 0 ? (_jsxs("div", { className: "text-center py-12 text-muted text-sm", children: ["No agents found", filter !== 'all' ? ` with capability "${filter}"` : ''] })) : (_jsx("div", { className: "grid grid-cols-2 gap-3", children: filtered.map((agent) => (_jsx(AgentCard, { agent: agent }, agent.agentId))) }))] }));
}
