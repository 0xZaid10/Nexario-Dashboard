import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useSessionStore } from '../store/session';
import { revokeSession } from '../lib/api';
export default function SettingsView() {
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const { apiKey, setApiKey, defaultMinReputation, setDefaultMinReputation, veniceQualityOracle, setVeniceQualityOracle, session, setSession, taskHistory, } = useSessionStore();
    const [apiKeyInput, setApiKeyInput] = useState(apiKey);
    const [saved, setSaved] = useState(false);
    const [revoking, setRevoking] = useState(false);
    function saveApiKey() {
        setApiKey(apiKeyInput);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    }
    async function handleRevokeSession() {
        if (!address || !session)
            return;
        setRevoking(true);
        try {
            await revokeSession(address, apiKey);
            setSession(null);
        }
        catch {
            setSession(null);
        }
        finally {
            setRevoking(false);
        }
    }
    const CONTRACTS = [
        { label: 'AgentRegistry', address: '0x80B5EE8dAE9D18a252072E1D35aEde9f8aF50054', chain: 'Sepolia' },
        { label: 'ReputationRegistry', address: '0x718B31833264B2CfC5010bD5C15f43178DB91d7c', chain: 'Sepolia' },
        { label: 'AuthorityLeaseRegistry', address: '0x1eFC01F8fD8F24Baa113fff70fA1e5D96BB39044', chain: 'Sepolia' },
        { label: 'ReputationGatedCaveat', address: '0x8300caFd1705c822a4c6719A60877A33F21c5A4F', chain: 'Sepolia' },
        { label: 'DelegationManager', address: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3', chain: 'Mainnet' },
    ];
    return (_jsxs("div", { className: "h-full overflow-y-auto px-6 py-5 max-w-xl", children: [_jsxs("div", { className: "mb-5", children: [_jsx("h2", { className: "font-display font-semibold text-text text-base", children: "Settings" }), _jsx("p", { className: "text-xs text-muted mt-0.5", children: "Configuration and contract addresses" })] }), _jsxs("div", { className: "space-y-5", children: [_jsx(Section, { title: "Wallet", children: isConnected && address ? (_jsxs("div", { className: "space-y-2", children: [_jsx(Row, { label: "Connected address", children: _jsx("span", { className: "font-mono text-xs text-text", children: address }) }), _jsx(Row, { label: "Network", children: _jsx("span", { className: "text-xs text-text", children: "Ethereum Mainnet + Sepolia" }) }), _jsx("button", { onClick: () => disconnect(), className: "text-xs text-danger hover:underline", children: "Disconnect wallet" })] })) : (_jsx("p", { className: "text-xs text-muted", children: "No wallet connected" })) }), _jsx(Section, { title: "Backend API Key", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "password", value: apiKeyInput, onChange: (e) => setApiKeyInput(e.target.value), placeholder: "nexario-dev-key-\u2026", className: "flex-1 bg-bg border border-border rounded-md px-3 py-1.5 text-xs font-mono text-text focus:outline-none focus:border-accent/50" }), _jsx("button", { onClick: saveApiKey, className: `px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${saved ? 'bg-success/20 text-success' : 'bg-surface border border-border text-muted hover:text-text'}`, children: saved ? '✓ Saved' : 'Save' })] }) }), _jsx(Section, { title: "Default Agent Requirements", children: _jsxs("div", { className: "space-y-3", children: [_jsx(Row, { label: "Min reputation threshold", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "range", min: 0, max: 100, value: defaultMinReputation, onChange: (e) => setDefaultMinReputation(Number(e.target.value)), className: "w-24 accent-accent" }), _jsx("span", { className: "font-mono text-xs text-accent w-6", children: defaultMinReputation })] }) }), _jsx(Row, { label: "Venice quality oracle", children: _jsx("button", { onClick: () => setVeniceQualityOracle(!veniceQualityOracle), className: `w-9 h-5 rounded-full transition-colors ${veniceQualityOracle ? 'bg-accent2' : 'bg-border'}`, children: _jsx("div", { className: `w-3.5 h-3.5 rounded-full bg-white mx-auto transition-transform ${veniceQualityOracle ? 'translate-x-2' : '-translate-x-2'}` }) }) }), _jsx("p", { className: "text-xs text-muted", children: "These become the defaults in the authorize modal. Override per-agent in advanced settings." })] }) }), session && (_jsx(Section, { title: "Active Session", children: _jsxs("div", { className: "space-y-2", children: [_jsx(Row, { label: "Session ID", children: _jsxs("span", { className: "font-mono text-xs text-muted", children: [session.sessionId.slice(0, 16), "\u2026"] }) }), _jsx(Row, { label: "Budget remaining", children: _jsxs("span", { className: "font-mono text-xs text-text", children: ["$", session.remainingUsdc.toFixed(2)] }) }), _jsx(Row, { label: "Expires", children: _jsx("span", { className: "text-xs text-text", children: new Date(session.expiresAt * 1000).toLocaleString() }) }), _jsx("button", { onClick: handleRevokeSession, disabled: revoking, className: "text-xs text-danger hover:underline disabled:opacity-50", children: revoking ? 'Revoking…' : 'Revoke session' })] }) })), _jsx(Section, { title: "Contract Addresses", children: _jsx("div", { className: "space-y-2", children: CONTRACTS.map(({ label, address: addr, chain }) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs text-text", children: label }), _jsx("div", { className: "text-xs text-muted", children: chain })] }), _jsxs("a", { href: `https://${chain === 'Sepolia' ? 'sepolia.' : ''}etherscan.io/address/${addr}`, target: "_blank", rel: "noopener noreferrer", className: "font-mono text-xs text-muted hover:text-accent transition-colors", title: addr, children: [addr.slice(0, 6), "\u2026", addr.slice(-4), " \u2197"] })] }, label))) }) }), _jsx(Section, { title: "Local Data", children: _jsxs("div", { className: "space-y-1 text-xs text-muted", children: [_jsx(Row, { label: "Tasks in history", children: _jsx("span", { children: taskHistory.length }) }), _jsx(Row, { label: "Storage", children: _jsx("button", { onClick: () => {
                                            if (confirm('Clear all local task history?')) {
                                                localStorage.removeItem('nexario-session');
                                                window.location.reload();
                                            }
                                        }, className: "text-danger hover:underline", children: "Clear local data" }) })] }) }), _jsx("div", { className: "text-xs text-muted pt-2 border-t border-border", children: "Nexario v1.0.0 \u00B7 MetaMask \u00D7 1Shot \u00D7 Venice Hackathon" })] })] }));
}
function Section({ title, children }) {
    return (_jsxs("div", { className: "card p-4", children: [_jsx("h3", { className: "font-display font-semibold text-xs text-muted uppercase tracking-wider mb-3", children: title }), children] }));
}
function Row({ label, children }) {
    return (_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("span", { className: "text-xs text-muted shrink-0", children: label }), _jsx("div", { className: "flex items-center gap-2", children: children })] }));
}
