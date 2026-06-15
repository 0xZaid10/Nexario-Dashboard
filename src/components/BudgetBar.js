import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSessionStore } from '../store/session';
export default function BudgetBar() {
    const { session } = useSessionStore();
    if (!session)
        return null;
    const pct = Math.max(0, Math.min(100, (session.remainingUsdc / session.budgetUsdc) * 100));
    const expiresIn = session.expiresAt - Math.floor(Date.now() / 1000);
    const expiresHours = Math.floor(expiresIn / 3600);
    const expiresMinutes = Math.floor((expiresIn % 3600) / 60);
    const barColor = pct > 50 ? 'bg-accent' : pct > 20 ? 'bg-warning' : 'bg-danger';
    const isExpiringSoon = expiresIn < 3600;
    return (_jsxs("div", { className: "flex items-center gap-4 px-6 py-2 bg-surface border-b border-border text-xs", children: [_jsxs("div", { className: "flex items-center gap-2 flex-1", children: [_jsx("span", { className: "text-muted shrink-0", children: "Session budget" }), _jsx("div", { className: "flex-1 h-1 bg-border rounded-full overflow-hidden max-w-32", children: _jsx("div", { className: `h-full rounded-full transition-all duration-500 ${barColor}`, style: { width: `${pct}%` } }) }), _jsxs("span", { className: "font-mono text-text shrink-0", children: ["$", session.remainingUsdc.toFixed(2), _jsxs("span", { className: "text-muted", children: [" / $", session.budgetUsdc.toFixed(2)] })] })] }), _jsxs("div", { className: `flex items-center gap-1 shrink-0 ${isExpiringSoon ? 'text-warning' : 'text-muted'}`, children: [_jsxs("svg", { width: "11", height: "11", viewBox: "0 0 11 11", fill: "none", children: [_jsx("circle", { cx: "5.5", cy: "5.5", r: "4.5", stroke: "currentColor", strokeWidth: "1" }), _jsx("path", { d: "M5.5 3V5.5L7 7", stroke: "currentColor", strokeWidth: "1", strokeLinecap: "round" })] }), _jsx("span", { children: expiresIn <= 0
                            ? 'Expired'
                            : expiresHours > 0
                                ? `${expiresHours}h ${expiresMinutes}m`
                                : `${expiresMinutes}m` })] }), Object.keys(session.agentRequirements ?? {}).length > 0 && (_jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [_jsx("div", { className: "w-1 h-1 rounded-full bg-accent" }), _jsxs("span", { className: "text-muted", children: [Object.keys(session.agentRequirements).length, " agent gates active"] })] })), session.veniceQualityOracle && (_jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [_jsx("div", { className: "w-1 h-1 rounded-full bg-accent2" }), _jsx("span", { className: "text-accent2", children: "Venice oracle" })] }))] }));
}
