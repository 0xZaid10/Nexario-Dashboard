import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/session';
const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: GridIcon },
    { id: 'agents', label: 'Agents', icon: AgentsIcon },
    { id: 'lease', label: 'Leasing', icon: LeaseIcon },
];
export default function Sidebar({ activeView, onNavigate, onOpenTask }) {
    const navigate = useNavigate();
    const { chats, activeChatId, createChat, setActiveChat, renameChat, deleteChat, } = useSessionStore();
    const [editingChatId, setEditingChatId] = useState(null);
    const [editName, setEditName] = useState('');
    function handleNewChat() {
        const chatId = createChat('New Chat');
        navigate('/chat');
    }
    function handleOpenChat(chatId) {
        setActiveChat(chatId);
        navigate('/chat');
    }
    function handleRenameStart(chatId, currentName, e) {
        e.stopPropagation();
        setEditingChatId(chatId);
        setEditName(currentName);
    }
    function handleRenameSubmit(chatId) {
        if (editName.trim())
            renameChat(chatId, editName.trim());
        setEditingChatId(null);
    }
    // Sort chats by lastActiveAt desc
    const sortedChats = Object.values(chats).sort((a, b) => b.lastActiveAt - a.lastActiveAt);
    return (_jsxs("aside", { className: "flex flex-col w-60 shrink-0 border-r border-white/[0.06]", style: { background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }, children: [_jsx("div", { className: "flex items-center px-5 py-5 border-b border-white/[0.05]", children: _jsx("span", { className: "font-display font-bold text-xl text-text tracking-wide", children: "Nexario" }) }), _jsx("nav", { className: "px-2.5 py-3 border-b border-white/[0.05]", children: NAV.map(({ id, label, icon: Icon }) => (_jsxs("button", { onClick: () => onNavigate(id), className: `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${activeView === id
                        ? 'bg-white/[0.08] text-white font-medium'
                        : 'text-muted hover:text-text hover:bg-white/[0.04]'}`, children: [_jsx(Icon, { size: 15 }), _jsx("span", { children: label })] }, id))) }), _jsxs("div", { className: "flex-1 overflow-y-auto px-2.5 py-3 min-h-0", children: [_jsxs("div", { className: "flex items-center justify-between px-2 py-1 mb-1.5", children: [_jsx("span", { className: "text-xs font-semibold text-muted uppercase tracking-widest", children: "Chats" }), _jsx("button", { onClick: handleNewChat, className: "text-xs text-muted hover:text-accent transition-colors", children: "+ New" })] }), sortedChats.length === 0 ? (_jsxs("div", { className: "px-2 py-4 text-center", children: [_jsx("div", { className: "text-xs text-muted", children: "No chats yet" }), _jsx("button", { onClick: handleNewChat, className: "text-xs text-accent hover:underline mt-1", children: "Start a chat \u2192" })] })) : (sortedChats.map((chat) => {
                        const isActive = chat.chatId === activeChatId;
                        const session = chat.session;
                        const isExpired = session ? (session.expiresAt * 1000 < Date.now() || session.isExpired) : false;
                        const remaining = session?.remainingUsdc ?? 0;
                        return (_jsx("div", { className: `group relative mb-0.5 rounded-md transition-colors cursor-pointer ${isActive ? 'bg-white/[0.07] border border-white/[0.10]' : 'hover:bg-white/[0.04]'}`, onClick: () => handleOpenChat(chat.chatId), children: _jsxs("div", { className: "px-2.5 py-2", children: [editingChatId === chat.chatId ? (_jsx("input", { value: editName, onChange: (e) => setEditName(e.target.value), onBlur: () => handleRenameSubmit(chat.chatId), onKeyDown: (e) => {
                                            if (e.key === 'Enter')
                                                handleRenameSubmit(chat.chatId);
                                            if (e.key === 'Escape')
                                                setEditingChatId(null);
                                            e.stopPropagation();
                                        }, onClick: (e) => e.stopPropagation(), autoFocus: true, className: "w-full bg-transparent text-xs text-text border-b border-white/20 outline-none pb-0.5" })) : (_jsxs("div", { className: "flex items-center justify-between gap-1", children: [_jsx("span", { className: `text-xs truncate flex-1 ${isActive ? 'text-white font-medium' : 'text-text'}`, children: chat.name }), _jsx("button", { onClick: (e) => handleRenameStart(chat.chatId, chat.name, e), className: "opacity-0 group-hover:opacity-100 text-muted hover:text-text transition-all text-xs", children: "\u270E" })] })), session && !isExpired && (_jsxs("div", { className: "flex items-center justify-between mt-1", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-success" }), _jsxs("span", { className: "text-xs text-muted", children: ["$", remaining.toFixed(2), " left"] })] }), _jsx("span", { className: "text-xs text-muted font-mono", children: formatExpiry(session.expiresAt) })] })), session && isExpired && (_jsxs("div", { className: "flex items-center gap-1 mt-1", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-danger" }), _jsx("span", { className: "text-xs text-danger", children: "Expired" })] })), !session && (_jsx("div", { className: "text-xs text-muted mt-0.5", children: "No authorization" })), (chat.messages?.length ?? 0) > 0 && (_jsxs("div", { className: "text-xs text-muted mt-0.5", children: [(chat.messages?.filter(m => m.type === 'user').length ?? 0), " message", (chat.messages?.filter(m => m.type === 'user').length ?? 0) !== 1 ? 's' : ''] }))] }) }, chat.chatId));
                    }))] }), _jsxs("div", { className: "px-4 py-3 border-t border-white/[0.05] space-y-1.5", children: [_jsx(ChainIndicator, { label: "Contracts", chain: "Base", color: "accent" }), _jsx(ChainIndicator, { label: "Relay", chain: "1Shot", color: "success" }), _jsx(ChainIndicator, { label: "AI", chain: "Venice", color: "accent2" })] })] }));
}
function formatExpiry(expiresAt) {
    const diff = expiresAt - Math.floor(Date.now() / 1000);
    if (diff <= 0)
        return 'expired';
    if (diff < 3600)
        return `${Math.floor(diff / 60)}m`;
    if (diff < 86400)
        return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}
function ChainIndicator({ label, chain, color }) {
    const dotColor = color === 'accent' ? 'bg-accent' : color === 'accent2' ? 'bg-accent2' : 'bg-success';
    return (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-muted", children: label }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: `w-1 h-1 rounded-full ${dotColor}` }), _jsx("span", { className: "text-xs text-muted", children: chain })] })] }));
}
// Icons
function GridIcon({ size = 16 }) {
    return _jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", children: [_jsx("rect", { x: "1", y: "1", width: "6", height: "6", rx: "1", stroke: "currentColor", strokeWidth: "1.3" }), _jsx("rect", { x: "9", y: "1", width: "6", height: "6", rx: "1", stroke: "currentColor", strokeWidth: "1.3" }), _jsx("rect", { x: "1", y: "9", width: "6", height: "6", rx: "1", stroke: "currentColor", strokeWidth: "1.3" }), _jsx("rect", { x: "9", y: "9", width: "6", height: "6", rx: "1", stroke: "currentColor", strokeWidth: "1.3" })] });
}
function AgentsIcon({ size = 16 }) {
    return _jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", children: [_jsx("circle", { cx: "8", cy: "5", r: "3", stroke: "currentColor", strokeWidth: "1.3" }), _jsx("path", { d: "M2 14C2 11.24 4.69 9 8 9C11.31 9 14 11.24 14 14", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" })] });
}
function LeaseIcon({ size = 16 }) {
    return _jsx("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", children: _jsx("path", { d: "M8 1L14 4V8C14 11.31 11.31 14 8 14C4.69 14 2 11.31 2 8V4L8 1Z", stroke: "currentColor", strokeWidth: "1.3", strokeLinejoin: "round" }) });
}
function SettingsIcon({ size = 16 }) {
    return _jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", children: [_jsx("circle", { cx: "8", cy: "8", r: "2.5", stroke: "currentColor", strokeWidth: "1.3" }), _jsx("path", { d: "M8 1V3M8 13V15M1 8H3M13 8H15M3.05 3.05L4.46 4.46M11.54 11.54L12.95 12.95M12.95 3.05L11.54 4.46M4.46 11.54L3.05 12.95", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" })] });
}
