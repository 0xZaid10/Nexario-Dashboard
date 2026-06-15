import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSessionStore } from '../store/session';
import { authorize } from '../lib/api';
import { DELEGATION_MANAGER } from '../config/wagmi';
import { requestExecutionPermissions } from '../lib/permissions';
const DEFAULT_REQS = {
    coordinator: { minReputation: 70, minRevenue: 0, maxBudget: 1 },
    research: { minReputation: 80, minRevenue: 0, maxBudget: 3 },
    audit: { minReputation: 85, minRevenue: 0, maxBudget: 4 },
    report: { minReputation: 75, minRevenue: 0, maxBudget: 2 },
    counsel: { minReputation: 85, minRevenue: 0, maxBudget: 3 },
    intelligence: { minReputation: 80, minRevenue: 0, maxBudget: 3 },
    reflection: { minReputation: 70, minRevenue: 0, maxBudget: 2 },
    reputation: { minReputation: 75, minRevenue: 0, maxBudget: 2 },
    monitor: { minReputation: 70, minRevenue: 0, maxBudget: 1 },
    executor: { minReputation: 80, minRevenue: 0, maxBudget: 2 },
};
export default function AuthorizeModal({ onClose, onAuthorized, chatId, chatName }) {
    const { address } = useAccount();
    const { apiKey, veniceQualityOracle, setVeniceQualityOracle } = useSessionStore();
    const [budget, setBudget] = useState(10);
    const [duration, setDuration] = useState(24);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [reqs, setReqs] = useState(DEFAULT_REQS);
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [permissionMethod, setPermissionMethod] = useState('');
    function updateReq(agent, field, value) {
        setReqs((prev) => ({ ...prev, [agent]: { ...prev[agent], [field]: value } }));
    }
    async function handleAuthorize() {
        if (!address)
            return;
        setStatus('signing');
        setErrorMsg('');
        try {
            const result = await requestExecutionPermissions({
                budgetUsdc: budget,
                durationHours: duration,
            });
            setPermissionMethod(result.method);
            const effectiveAddress = result.address ?? address;
            if (result.isDemo)
                console.warn('Using demo permissionsContext');
            const permissionsContext = result.permissionsContext;
            setStatus('authorizing');
            const authResult = await authorize({
                permissionsContext,
                delegationManager: DELEGATION_MANAGER,
                budget: `${budget} USDC`,
                actions: ['coordinate', 'research', 'audit', 'report', 'counsel', 'intelligence', 'reflection', 'reputation', 'monitor', 'execute'],
                durationHours: duration,
                agentRequirements: reqs,
                veniceQualityOracle,
                chatId,
                chatName: chatName ?? 'New Chat',
            }, effectiveAddress ?? address ?? '', apiKey);
            const session = {
                sessionId: authResult.leaseId,
                chatId: chatId ?? authResult.chatId ?? '',
                budgetUsdc: authResult.budgetUsdc,
                remainingUsdc: authResult.remainingUsdc,
                spentUsdc: 0,
                expiresAt: authResult.expiresAt,
                allowedActions: ['research', 'audit', 'report'],
                agentRequirements: authResult.agentRequirements ?? reqs,
                veniceQualityOracle: authResult.veniceQualityOracle ?? veniceQualityOracle,
                permissionsContext,
                delegationManager: DELEGATION_MANAGER,
                isExpired: false,
            };
            setStatus('done');
            setTimeout(() => {
                onClose();
                onAuthorized?.(session);
            }, 800);
        }
        catch (err) {
            setStatus('error');
            setErrorMsg(err instanceof Error ? err.message : 'Authorization failed');
        }
    }
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/70 backdrop-blur-sm", onClick: onClose }), _jsxs("div", { className: "relative w-full max-w-md card animate-slide-up", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-border", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-display font-semibold text-text text-sm", children: "Authorize Agent Network" }), _jsx("p", { className: "text-xs text-muted mt-0.5", children: "One approval \u2014 agents handle the rest" })] }), _jsx("button", { onClick: onClose, className: "text-muted hover:text-text transition-colors p-1", children: "\u2715" })] }), _jsxs("div", { className: "px-5 py-4 space-y-5", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("label", { className: "text-xs font-medium text-text", children: "Total Budget" }), _jsxs("span", { className: "font-mono text-sm font-semibold text-accent", children: ["$", budget, " USDC"] })] }), _jsx("input", { type: "range", min: 1, max: 100, value: budget, onChange: (e) => setBudget(Number(e.target.value)), className: "w-full accent-accent h-1 rounded-full" }), _jsxs("div", { className: "flex justify-between text-xs text-muted mt-1", children: [_jsx("span", { children: "$1" }), _jsxs("span", { children: ["~", Math.floor(budget / 0.05), " agent calls"] }), _jsx("span", { children: "$100" })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("label", { className: "text-xs font-medium text-text", children: "Duration" }), _jsxs("span", { className: "font-mono text-xs text-muted", children: [duration, "h"] })] }), _jsx("div", { className: "grid grid-cols-4 gap-1.5", children: [1, 6, 24, 72].map((h) => (_jsxs("button", { onClick: () => setDuration(h), className: `py-1.5 rounded-md text-xs font-medium transition-colors ${duration === h
                                                ? 'bg-white text-black'
                                                : 'bg-white/[0.04] border border-white/[0.08] text-muted hover:text-text hover:bg-white/[0.08]'}`, children: [h, "h"] }, h))) })] }), _jsxs("div", { className: "flex items-center justify-between py-2 border-t border-border", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-medium text-text", children: "Venice Quality Oracle" }), _jsx("div", { className: "text-xs text-muted mt-0.5", children: "Venice scores each agent after execution and writes reputation" })] }), _jsx("button", { onClick: () => setVeniceQualityOracle(!veniceQualityOracle), className: `w-9 h-5 rounded-full transition-colors shrink-0 ${veniceQualityOracle ? 'bg-accent2' : 'bg-border'}`, children: _jsx("div", { className: `w-3.5 h-3.5 rounded-full bg-white mx-auto transition-transform ${veniceQualityOracle ? 'translate-x-2' : '-translate-x-2'}` }) })] }), _jsxs("div", { className: "border-t border-border pt-3", children: [_jsxs("button", { onClick: () => setShowAdvanced(!showAdvanced), className: "flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors", children: [_jsx("span", { children: showAdvanced ? '▾' : '▸' }), _jsx("span", { children: "Per-agent trust requirements" })] }), showAdvanced && (_jsxs("div", { className: "mt-3 space-y-3 animate-fade-in", children: [Object.entries(reqs).map(([agent, req]) => (_jsxs("div", { className: "p-3 rounded-md bg-bg border border-border", children: [_jsxs("div", { className: "text-xs font-medium text-text capitalize mb-2.5", children: [agent, " agent"] }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs text-muted mb-1", children: "Min Rep" }), _jsx("input", { type: "number", min: 0, max: 100, value: req.minReputation, onChange: (e) => updateReq(agent, 'minReputation', Number(e.target.value)), className: "w-full bg-surface border border-border rounded px-2 py-1 text-xs font-mono text-text focus:outline-none focus:border-accent" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-muted mb-1", children: "Min Rev $" }), _jsx("input", { type: "number", min: 0, value: req.minRevenue, onChange: (e) => updateReq(agent, 'minRevenue', Number(e.target.value)), className: "w-full bg-surface border border-border rounded px-2 py-1 text-xs font-mono text-text focus:outline-none focus:border-accent" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-muted mb-1", children: "Max $" }), _jsx("input", { type: "number", min: 0.5, max: budget, step: 0.5, value: req.maxBudget, onChange: (e) => updateReq(agent, 'maxBudget', Number(e.target.value)), className: "w-full bg-surface border border-border rounded px-2 py-1 text-xs font-mono text-text focus:outline-none focus:border-accent" })] })] })] }, agent))), _jsx("p", { className: "text-xs text-muted", children: "These requirements are encoded into the delegation caveats. Agents below threshold are blocked at the protocol level." })] }))] }), _jsxs("div", { className: "p-2.5 rounded-md bg-warning/10 border border-warning/20 text-xs text-warning", children: ["\u26A0 Requires MetaMask Flask 13.5.0+ for ERC-7715 signing.", ' ', _jsx("a", { href: "https://metamask.io/flask/", target: "_blank", rel: "noopener noreferrer", className: "underline", children: "Get Flask \u2192" })] }), status === 'error' && (_jsx("div", { className: "p-3 rounded-md bg-danger/10 border border-danger/30 text-xs text-danger", children: errorMsg })), _jsxs("button", { onClick: handleAuthorize, disabled: !address || status === 'signing' || status === 'authorizing' || status === 'done', className: `
              w-full py-3 rounded-md font-display font-semibold text-sm
              transition-all duration-200 flex items-center justify-center gap-2
              ${status === 'done'
                                    ? 'bg-success text-white'
                                    : status === 'signing' || status === 'authorizing'
                                        ? 'bg-white/20 text-white cursor-wait'
                                        : !address
                                            ? 'bg-white/[0.06] text-muted cursor-not-allowed'
                                            : 'bg-white hover:bg-white/90 text-black'}
            `, children: [status === 'idle' && !address && 'Connect wallet first', status === 'idle' && address && 'Approve Authorization', status === 'signing' && (_jsxs(_Fragment, { children: [_jsx(Spinner, {}), "Waiting for MetaMask\u2026"] })), status === 'authorizing' && (_jsxs(_Fragment, { children: [_jsx(Spinner, {}), "Authorizing agents\u2026"] })), status === 'done' && '✓ Authorized', status === 'error' && (_jsxs(_Fragment, { children: [_jsx("span", { children: "\u21BA" }), "Try again"] }))] }), _jsxs("div", { className: "text-xs text-muted space-y-1", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-accent shrink-0 mt-0.5", children: "\u2192" }), _jsx("span", { children: "One MetaMask Flask signature creates an ERC-7715 authority lease on Base" })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-accent shrink-0 mt-0.5", children: "\u2192" }), _jsx("span", { children: "Agents receive scoped sub-delegations \u2014 never your full key" })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-accent shrink-0 mt-0.5", children: "\u2192" }), _jsx("span", { children: "Reputation gates enforce your requirements on-chain (Sepolia)" })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-warning shrink-0 mt-0.5", children: "\u26A1" }), _jsx("span", { children: "Requires Base USDC for 1Shot relay fees (~$0.01 per task)" })] })] })] })] })] }));
}
function Spinner() {
    return (_jsxs("svg", { className: "animate-spin", width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", children: [_jsx("circle", { cx: "7", cy: "7", r: "5.5", stroke: "currentColor", strokeWidth: "1.5", strokeOpacity: "0.3" }), _jsx("path", { d: "M7 1.5A5.5 5.5 0 0 1 12.5 7", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }));
}
