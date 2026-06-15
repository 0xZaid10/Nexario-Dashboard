import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSessionStore } from '../store/session';
export default function LeaseView() {
    const { address, isConnected } = useAccount();
    const { session, setSession, taskHistory, apiKey } = useSessionStore();
    const [revoking, setRevoking] = useState(null);
    const [revoked, setRevoked] = useState(new Set());
    // Extract delegation chains from task history
    const leases = taskHistory
        .filter((t) => (t.delegationSteps?.length ?? 0) > 0)
        .map((t) => ({
        taskId: t.taskId,
        prompt: t.prompt,
        status: t.status,
        createdAt: t.createdAt,
        steps: t.delegationSteps ?? [],
    }));
    async function handleRevokeSession() {
        if (!address || !session)
            return;
        const confirmed = window.confirm(`Revoke all authority?\n\nThis will:\n• Cancel your $${session.remainingUsdc.toFixed(2)} USDC session\n• Block all sub-agents immediately\n• Record revocation on-chain\n\nThis cannot be undone.`);
        if (!confirmed)
            return;
        setRevoking('session');
        try {
            const res = await fetch('/api/authorize/session', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Address': address,
                    'X-API-Key': apiKey,
                },
                body: JSON.stringify({ sessionId: session.sessionId }),
            });
            if (res.ok) {
                setSession(null); // only clear AFTER confirmed success
            }
            else {
                const err = await res.json();
                alert(`Revoke failed: ${err.error ?? 'Unknown error'}`);
            }
        }
        catch (err) {
            console.error('Revoke session failed:', err);
            alert('Revoke failed — check console');
        }
        finally {
            setRevoking(null);
        }
    }
    async function handleRevokeLease(leaseId) {
        if (!address || revoking)
            return;
        setRevoking(leaseId);
        try {
            const res = await fetch('/api/authorize/revoke-lease', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Address': address,
                    'X-API-Key': apiKey,
                },
                body: JSON.stringify({ leaseId }),
            });
            if (res.ok) {
                setRevoked((prev) => new Set([...prev, leaseId]));
            }
        }
        catch (err) {
            console.error('Revoke failed:', err);
        }
        finally {
            setRevoking(null);
        }
    }
    async function handleRevokeStep(stepId, txHash) {
        if (!address || revoking)
            return;
        // For individual sub-agent steps, we revoke the delegation
        // using the txHash as identifier
        setRevoking(stepId);
        try {
            // DelegationManager.disableDelegation() would be called here
            // For now mark as revoked locally and show on-chain link
            setRevoked((prev) => new Set([...prev, stepId]));
            if (txHash) {
                window.open(`https://basescan.org/tx/${txHash}`, '_blank');
            }
        }
        finally {
            setRevoking(null);
        }
    }
    return (_jsxs("div", { className: "h-full overflow-y-auto px-6 py-5", children: [_jsxs("div", { className: "mb-5", children: [_jsx("h2", { className: "font-display font-semibold text-text text-base", children: "Capability Leasing" }), _jsx("p", { className: "text-xs text-muted mt-0.5", children: "On-chain authority leases \u2014 ERC-7710 redelegation chains" })] }), !isConnected ? (_jsx("div", { className: "card p-6 text-center text-sm text-muted", children: "Connect MetaMask to view your authority leases" })) : (_jsxs("div", { className: "space-y-5", children: [session && (_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-medium text-muted uppercase tracking-wider mb-2", children: "Active Session Lease" }), _jsxs("div", { className: "card p-4 border-white/[0.06]", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-medium text-text", children: "Authority Lease" }), _jsxs("div", { className: "addr mt-0.5", children: [session.sessionId.slice(0, 16), "\u2026"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "flex items-center gap-1 text-xs text-success", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-success" }), "Active"] }), _jsx("button", { onClick: handleRevokeSession, disabled: revoking === 'session', className: "px-2.5 py-1 rounded-md text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20 transition-colors disabled:opacity-50", children: revoking === 'session' ? 'Revoking…' : 'Revoke All' })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 text-xs mb-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-muted mb-0.5", children: "Budget" }), _jsxs("div", { className: "font-mono text-text", children: ["$", session.remainingUsdc.toFixed(2), " / $", session.budgetUsdc.toFixed(2), " USDC"] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-muted mb-0.5", children: "Expires" }), _jsx("div", { className: "font-mono text-text", children: new Date(session.expiresAt * 1000).toLocaleString() })] })] }), Object.keys(session.agentRequirements ?? {}).length > 0 && (_jsxs("div", { className: "text-xs text-muted", children: [Object.keys(session.agentRequirements).length, " agents authorized"] })), session.veniceQualityOracle && (_jsxs("div", { className: "flex items-center gap-1.5 mt-2 pt-2 border-t border-border text-xs text-muted", children: [_jsx("div", { className: "w-1 h-1 rounded-full bg-muted" }), "Venice quality oracle active"] }))] })] })), leases.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-medium text-muted uppercase tracking-wider mb-2", children: "Task Delegation Chains" }), _jsx("div", { className: "space-y-2", children: leases.map((lease) => (_jsxs("div", { className: `card p-3 ${revoked.has(lease.taskId) ? 'opacity-50' : ''}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("p", { className: "text-xs text-text truncate flex-1 mr-2", children: lease.prompt }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsx(StatusBadge, { status: lease.status }), !revoked.has(lease.taskId) && lease.status !== 'failed' && (_jsx("button", { onClick: () => handleRevokeLease(lease.taskId), disabled: revoking === lease.taskId, className: "text-xs text-danger hover:bg-danger/10 px-2 py-0.5 rounded transition-colors disabled:opacity-50", children: revoking === lease.taskId ? 'Revoking…' : 'Revoke' })), revoked.has(lease.taskId) && (_jsx("span", { className: "text-xs text-muted", children: "Revoked" }))] })] }), _jsxs("div", { className: "flex items-center gap-1.5 flex-wrap mb-2", children: [_jsx(ChainBadge, { label: "User", color: "text-text" }), lease.steps.map((step) => (_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(ArrowIcon, {}), _jsx(ChainBadge, { label: step.agentName, color: revoked.has(step.stepId) ? 'text-muted line-through'
                                                                : step.status === 'confirmed' ? 'text-success'
                                                                    : step.status === 'blocked' ? 'text-danger'
                                                                        : 'text-muted', txHash: step.txHash })] }, step.stepId)))] }), _jsxs("div", { className: "text-xs text-muted font-mono", children: [lease.taskId.slice(0, 8), " \u00B7 ", new Date(lease.createdAt).toLocaleString()] })] }, lease.taskId))) })] })), !session && leases.length === 0 && (_jsxs("div", { className: "card p-6 text-center", children: [_jsx("div", { className: "text-sm text-muted mb-2", children: "No active authority leases" }), _jsx("p", { className: "text-xs text-muted max-w-sm mx-auto", children: "Authority leases are created when you authorize an agent network. Each lease is recorded on-chain with a full audit trail." })] })), _jsxs("div", { className: "card p-4", children: [_jsx("h4", { className: "font-display font-semibold text-xs text-text mb-3", children: "How Revocation Works" }), _jsx("div", { className: "space-y-2 text-xs text-muted", children: [
                                    ['Revoke All', 'Revokes your session and all child leases instantly. No agent can execute further.'],
                                    ['Revoke Agent', 'Revokes a specific sub-delegation. Only that agent is blocked. Others continue.'],
                                    ['On-chain', 'Revocation is instant and on-chain. AuthorityLeaseRegistry.revokeLease() cascades to all children.'],
                                    ['ERC-7715', 'Your original permission in MetaMask Flask also expires at the set duration or when revoked.'],
                                ].map(([fn, desc]) => (_jsxs("div", { className: "flex items-start gap-2", children: [_jsx("code", { className: "text-muted shrink-0 mt-0.5 font-mono", children: fn }), _jsx("span", { children: desc })] }, fn))) })] })] }))] }));
}
function ChainBadge({ label, color, txHash }) {
    const content = (_jsx("span", { className: `text-xs font-medium capitalize px-1.5 py-0.5 rounded bg-surface border border-border ${color}`, children: label }));
    if (txHash) {
        return (_jsx("a", { href: `https://basescan.org/tx/${txHash}`, target: "_blank", rel: "noopener noreferrer", title: txHash, children: content }));
    }
    return content;
}
function StatusBadge({ status }) {
    const config = {
        completed: { text: 'text-success', label: 'Done' },
        running: { text: 'text-accent', label: 'Running' },
        failed: { text: 'text-danger', label: 'Failed' },
    }[status] ?? { text: 'text-muted', label: status };
    return _jsx("span", { className: `text-xs ${config.text} shrink-0`, children: config.label });
}
function ArrowIcon() {
    return (_jsx("svg", { width: "12", height: "8", viewBox: "0 0 12 8", fill: "none", children: _jsx("path", { d: "M1 4H10M10 4L7 1M10 4L7 7", stroke: "#64748B", strokeWidth: "1", strokeLinecap: "round" }) }));
}
