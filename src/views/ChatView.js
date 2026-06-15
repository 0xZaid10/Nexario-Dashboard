import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/session';
import { submitTask, subscribeToTask, fetchChats, fetchMessages } from '../lib/api';
import DelegationGraph from '../components/DelegationGraph';
import MessageThread from '../components/MessageThread';
import AudioPlayer from '../components/AudioPlayer';
import AuthorizeModal from '../components/AuthorizeModal';
import ScheduleModal from '../components/ScheduleModal';
import { randomUUID } from '../lib/utils';
export default function ChatView({ initialTaskId }) {
    const { address } = useAccount();
    const navigate = useNavigate();
    const { chats, activeChatId, createChat, setActiveChat, getChat, getActiveChat, setChatSession, addChatMessage, updateChatMessage, updateChatSession, clearChatMessages, taskHistory, addTask, updateTask, updateDelegationStep, getTask, session, preferredAgentIds, agentPreference, apiKey, } = useSessionStore();
    // Ensure there's always an active chat — set from existing chats only, never create here
    useEffect(() => {
        const state = useSessionStore.getState();
        if (!state.activeChatId || !state.chats[state.activeChatId]) {
            const firstId = Object.keys(state.chats)[0];
            if (firstId)
                state.setActiveChat(firstId);
            // Don't create chats here — App.tsx handles creation after hydration
        }
    }, []); // eslint-disable-line
    const activeChat = getActiveChat();
    const chatId = activeChatId ?? '';
    const messages = activeChat?.messages ?? [];
    const chatSession = activeChat?.session ?? null;
    const [input, setInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPlanning, setIsPlanning] = useState(false);
    const [planPreview, setPlanPreview] = useState(null);
    const [pendingPrompt, setPendingPrompt] = useState('');
    const [agentChoice, setAgentChoice] = useState(null);
    const [showAuthorize, setShowAuthorize] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [schedulePrompt, setSchedulePrompt] = useState('');
    const [activeTaskIds, setActiveTaskIds] = useState(new Set());
    const inputRef = useRef(null);
    const threadRef = useRef(null);
    const unsubRefs = useRef(new Map());
    // Auto-scroll
    useEffect(() => {
        if (threadRef.current) {
            threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }
    }, [messages.length]);
    // Cleanup SSE on unmount
    useEffect(() => {
        return () => { unsubRefs.current.forEach((unsub) => unsub()); };
    }, []);
    const subscribeToTaskEvents = useCallback((taskId, msgId) => {
        if (!address || !chatId)
            return;
        unsubRefs.current.get(taskId)?.();
        const unsub = subscribeToTask(taskId, address, apiKey, (event) => handleSSEEvent(taskId, msgId, event), () => {
            updateTask(taskId, { status: 'failed' });
            updateChatMessage(chatId, msgId, { status: 'failed', content: 'Task failed — check session budget.' });
            setActiveTaskIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
        });
        unsubRefs.current.set(taskId, unsub);
    }, [address, apiKey, chatId]); // eslint-disable-line
    // Load persisted messages from backend when switching chats
    useEffect(() => {
        if (!address || !chatId)
            return;
        const chat = chats[chatId];
        if (!chat)
            return;
        // Always load from backend to get latest messages
        fetchMessages(address, apiKey, chatId).then(({ messages: backendMsgs }) => {
            if (backendMsgs.length === 0)
                return;
            // Clear existing and reload from backend
            clearChatMessages(chatId);
            backendMsgs.forEach(msg => {
                addChatMessage(chatId, {
                    id: msg.id,
                    type: msg.type,
                    content: msg.content,
                    taskId: msg.taskId,
                    audioUrl: msg.audioUrl,
                    status: 'completed',
                    createdAt: msg.createdAt * 1000,
                    delegationSteps: [],
                });
            });
        }).catch(() => { });
    }, [chatId, address]); // eslint-disable-line
    function handleSSEEvent(taskId, msgId, event) {
        switch (event.type) {
            case 'delegation_step': {
                const step = {
                    agentName: event.agentName ?? '',
                    status: event.status ?? 'pending',
                    txHash: event.txHash,
                    budgetAllocated: event.budgetAllocated,
                };
                updateDelegationStep(taskId, event.stepId ?? event.agentName ?? '', step);
                const task = getTask(taskId);
                if (task)
                    updateChatMessage(chatId, msgId, { delegationSteps: task.delegationSteps });
                break;
            }
            case 'step_confirmed':
                updateDelegationStep(taskId, event.stepId ?? event.agentName ?? '', {
                    status: 'confirmed', txHash: event.txHash, blockNumber: event.blockNumber, output: event.output,
                });
                break;
            case 'step_blocked':
                updateDelegationStep(taskId, event.stepId ?? event.agentName ?? '', {
                    status: 'blocked', errorMessage: event.errorMessage ?? 'ReputationTooLow',
                });
                break;
            case 'task_complete':
                updateTask(taskId, { status: 'completed', result: event.result?.content, audioUrl: event.result?.audioUrl });
                updateChatMessage(chatId, msgId, {
                    status: 'completed', content: event.result?.content ?? '', audioUrl: event.result?.audioUrl, txDetails: event.result?.txDetails, totalSpentUsdc: event.result?.totalSpentUsdc,
                });
                setActiveTaskIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
                unsubRefs.current.get(taskId)?.();
                // Refresh session budget from backend
                if (address) {
                    fetchChats(address, apiKey).then(({ threads }) => {
                        const thread = threads.find(t => t.chatId === chatId);
                        if (thread?.session) {
                            updateChatSession(chatId, {
                                remainingUsdc: thread.session.remainingUsdc,
                                spentUsdc: thread.session.spentUsdc,
                            });
                        }
                    }).catch(() => { });
                }
                break;
            case 'task_failed':
                updateTask(taskId, { status: 'failed' });
                updateChatMessage(chatId, msgId, { status: 'failed', content: event.error ?? 'Task failed' });
                setActiveTaskIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
                unsubRefs.current.get(taskId)?.();
                break;
            case 'autonomous_task_started':
                addChatMessage(chatId, {
                    id: randomUUID(), type: 'autonomous', content: '',
                    taskId: event.taskId,
                    scheduledBy: event.scheduledBy,
                    triggeredBy: event.triggeredBy,
                    status: 'running', delegationSteps: [], createdAt: Date.now(),
                });
                break;
        }
    }
    async function handleSubmit() {
        if (!input.trim() || !address || isSubmitting || !chatId)
            return;
        const prompt = input.trim();
        setInput('');
        setIsPlanning(true);
        setPendingPrompt(prompt);
        addChatMessage(chatId, {
            id: randomUUID(), type: 'user', content: prompt, createdAt: Date.now(),
        });
        // Auto-name chat from first user message
        const currentChat = getActiveChat();
        const userMsgCount = (currentChat?.messages ?? []).filter(m => m.type === 'user').length;
        if (userMsgCount === 0 && (currentChat?.name === 'New Chat' || !currentChat?.name)) {
            const words = prompt.trim().split(/\s+/).slice(0, 5).join(' ');
            const autoName = words.length < prompt.trim().length ? words + '…' : words;
            useSessionStore.getState().renameChat(chatId, autoName);
        }
        try {
      if (!chatSession) {
        setShowAuthorize(true)
        return
      }
      await executeTask(prompt, null, agentPreference)
    } catch (err) {
      addChatMessage(chatId, {
        id: randomUUID(), type: 'system',
        content: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        createdAt: Date.now(),
      })
    } finally {
      setIsPlanning(false)
    }
  }ort { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/session';
import { submitTask, subscribeToTask, fetchChats, fetchMessages } from '../lib/api';
import DelegationGraph from '../components/DelegationGraph';
import MessageThread from '../components/MessageThread';
import AudioPlayer from '../components/AudioPlayer';
import AuthorizeModal from '../components/AuthorizeModal';
import ScheduleModal from '../components/ScheduleModal';
import { randomUUID } from '../lib/utils';
export default function ChatView({ initialTaskId }) {
    const { address } = useAccount();
    const navigate = useNavigate();
    const { chats, activeChatId, createChat, setActiveChat, getChat, getActiveChat, setChatSession, addChatMessage, updateChatMessage, updateChatSession, clearChatMessages, taskHistory, addTask, updateTask, updateDelegationStep, getTask, session, preferredAgentIds, agentPreference, apiKey, } = useSessionStore();
    // Ensure there's always an active chat — set from existing chats only, never create here
    useEffect(() => {
        const state = useSessionStore.getState();
        if (!state.activeChatId || !state.chats[state.activeChatId]) {
            const firstId = Object.keys(state.chats)[0];
            if (firstId)
                state.setActiveChat(firstId);
            // Don't create chats here — App.tsx handles creation after hydration
        }
    }, []); // eslint-disable-line
    const activeChat = getActiveChat();
    const chatId = activeChatId ?? '';
    const messages = activeChat?.messages ?? [];
    const chatSession = activeChat?.session ?? null;
    const [input, setInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPlanning, setIsPlanning] = useState(false);
    const [planPreview, setPlanPreview] = useState(null);
    const [pendingPrompt, setPendingPrompt] = useState('');
    const [agentChoice, setAgentChoice] = useState(null);
    const [showAuthorize, setShowAuthorize] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [schedulePrompt, setSchedulePrompt] = useState('');
    const [activeTaskIds, setActiveTaskIds] = useState(new Set());
    const inputRef = useRef(null);
    const threadRef = useRef(null);
    const unsubRefs = useRef(new Map());
    // Auto-scroll
    useEffect(() => {
        if (threadRef.current) {
            threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }
    }, [messages.length]);
    // Cleanup SSE on unmount
    useEffect(() => {
        return () => { unsubRefs.current.forEach((unsub) => unsub()); };
    }, []);
    const subscribeToTaskEvents = useCallback((taskId, msgId) => {
        if (!address || !chatId)
            return;
        unsubRefs.current.get(taskId)?.();
        const unsub = subscribeToTask(taskId, address, apiKey, (event) => handleSSEEvent(taskId, msgId, event), () => {
            updateTask(taskId, { status: 'failed' });
            updateChatMessage(chatId, msgId, { status: 'failed', content: 'Task failed — check session budget.' });
            setActiveTaskIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
        });
        unsubRefs.current.set(taskId, unsub);
    }, [address, apiKey, chatId]); // eslint-disable-line
    // Load persisted messages from backend when switching chats
    useEffect(() => {
        if (!address || !chatId)
            return;
        const chat = chats[chatId];
        if (!chat)
            return;
        // Always load from backend to get latest messages
        fetchMessages(address, apiKey, chatId).then(({ messages: backendMsgs }) => {
            if (backendMsgs.length === 0)
                return;
            // Clear existing and reload from backend
            clearChatMessages(chatId);
            backendMsgs.forEach(msg => {
                addChatMessage(chatId, {
                    id: msg.id,
                    type: msg.type,
                    content: msg.content,
                    taskId: msg.taskId,
                    audioUrl: msg.audioUrl,
                    status: 'completed',
                    createdAt: msg.createdAt * 1000,
                    delegationSteps: [],
                });
            });
        }).catch(() => { });
    }, [chatId, address]); // eslint-disable-line
    function handleSSEEvent(taskId, msgId, event) {
        switch (event.type) {
            case 'delegation_step': {
                const step = {
                    agentName: event.agentName ?? '',
                    status: event.status ?? 'pending',
                    txHash: event.txHash,
                    budgetAllocated: event.budgetAllocated,
                };
                updateDelegationStep(taskId, event.stepId ?? event.agentName ?? '', step);
                const task = getTask(taskId);
                if (task)
                    updateChatMessage(chatId, msgId, { delegationSteps: task.delegationSteps });
                break;
            }
            case 'step_confirmed':
                updateDelegationStep(taskId, event.stepId ?? event.agentName ?? '', {
                    status: 'confirmed', txHash: event.txHash, blockNumber: event.blockNumber, output: event.output,
                });
                break;
            case 'step_blocked':
                updateDelegationStep(taskId, event.stepId ?? event.agentName ?? '', {
                    status: 'blocked', errorMessage: event.errorMessage ?? 'ReputationTooLow',
                });
                break;
            case 'task_complete':
                updateTask(taskId, { status: 'completed', result: event.result?.content, audioUrl: event.result?.audioUrl });
                updateChatMessage(chatId, msgId, {
                    status: 'completed', content: event.result?.content ?? '', audioUrl: event.result?.audioUrl, txDetails: event.result?.txDetails, totalSpentUsdc: event.result?.totalSpentUsdc,
                });
                setActiveTaskIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
                unsubRefs.current.get(taskId)?.();
                // Refresh session budget from backend
                if (address) {
                    fetchChats(address, apiKey).then(({ threads }) => {
                        const thread = threads.find(t => t.chatId === chatId);
                        if (thread?.session) {
                            updateChatSession(chatId, {
                                remainingUsdc: thread.session.remainingUsdc,
                                spentUsdc: thread.session.spentUsdc,
                            });
                        }
                    }).catch(() => { });
                }
                break;
            case 'task_failed':
                updateTask(taskId, { status: 'failed' });
                updateChatMessage(chatId, msgId, { status: 'failed', content: event.error ?? 'Task failed' });
                setActiveTaskIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
                unsubRefs.current.get(taskId)?.();
                break;
            case 'autonomous_task_started':
                addChatMessage(chatId, {
                    id: randomUUID(), type: 'autonomous', content: '',
                    taskId: event.taskId,
                    scheduledBy: event.scheduledBy,
                    triggeredBy: event.triggeredBy,
                    status: 'running', delegationSteps: [], createdAt: Date.now(),
                });
                break;
        }
    }
    async function handleSubmit() {
        if (!input.trim() || !address || isSubmitting || !chatId)
            return;
        const prompt = input.trim();
        setInput('');
        setIsPlanning(true);
        setPendingPrompt(prompt);
        addChatMessage(chatId, {
            id: randomUUID(), type: 'user', content: prompt, createdAt: Date.now(),
        });
        // Auto-name chat from first user message
        const currentChat = getActiveChat();
        const userMsgCount = (currentChat?.messages ?? []).filter(m => m.type === 'user').length;
        if (userMsgCount === 0 && (currentChat?.name === 'New Chat' || !currentChat?.name)) {
            const words = prompt.trim().split(/\s+/).slice(0, 5).join(' ');
            const autoName = words.length < prompt.trim().length ? words + '…' : words;
            useSessionStore.getState().renameChat(chatId, autoName);
        }
        try {
            if (!chatSession) {
                setShowAuthorize(true);
                return;
            }
            await executeTask(prompt, null, agentPreference);
        }
        catch (err) {
            addChatMessage(chatId, {
                id: randomUUID(), type: 'system',
                content: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                createdAt: Date.now(),
            });
        }
        finally {
            setIsPlanning(false);
        }
    }
    async function executeTask(prompt, plan, preference) {
        if (!address || !chatSession || !chatId)
            return;
        setIsSubmitting(true);
        const agentMsgId = randomUUID();
        addChatMessage(chatId, {
            id: agentMsgId, type: 'agent', content: '',
            status: 'running', delegationSteps: [], createdAt: Date.now() + 1,
        });
        try {
            const response = await submitTask(prompt, chatSession.permissionsContext, chatSession.delegationManager, address, apiKey, {
                chatId,
                preferredAgentIds: preference !== 'system' && preferredAgentIds.length > 0 ? preferredAgentIds : undefined,
                agentPreference: preference ?? undefined,
            });
            const task = {
                taskId: response.taskId, chatId,
                prompt, status: 'running', createdAt: Date.now(), delegationSteps: [],
            };
            addTask(task);
            updateChatMessage(chatId, agentMsgId, { taskId: response.taskId });
            setActiveTaskIds((prev) => new Set([...prev, response.taskId]));
            subscribeToTaskEvents(response.taskId, agentMsgId);
            setPlanPreview(null);
            setPendingPrompt('');
            setAgentChoice(null);
        }
        catch (err) {
            updateChatMessage(chatId, agentMsgId, {
                status: 'failed', content: err instanceof Error ? err.message : 'Failed to submit task',
            });
        }
        finally {
            setIsSubmitting(false);
            inputRef.current?.focus();
        }
    }
    async function handleAgentChoiceReply(choice) {
        setAgentChoice(choice);
        const labels = { user: 'Use my agents', system: 'Let coordinator choose', mix: 'Mix — prefer mine' };
        addChatMessage(chatId, { id: randomUUID(), type: 'user', content: labels[choice], createdAt: Date.now() });
        if (!chatSession) {
            setShowAuthorize(true);
            return;
        }
        await executeTask(pendingPrompt, planPreview, choice);
    }
    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }
    function handleScheduleClick() {
        const lastUserMsg = [...messages].reverse().find((m) => m.type === 'user');
        setSchedulePrompt(lastUserMsg?.content ?? input);
        setShowSchedule(true);
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-col h-full overflow-hidden", children: [chatSession && !chatSession.isExpired && (_jsxs("div", { className: "px-4 py-2 bg-surface border-b border-border flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3 text-xs", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-success" }), _jsx("span", { className: "text-success font-medium", children: activeChat?.name })] }), _jsxs("span", { className: "text-muted", children: ["$", chatSession.remainingUsdc.toFixed(2), " / $", chatSession.budgetUsdc.toFixed(2), " USDC"] }), _jsx("span", { className: "text-muted", children: "\u00B7" }), _jsxs("span", { className: "text-muted", children: ["expires ", formatExpiry(chatSession.expiresAt)] })] }), chatSession.veniceQualityOracle && (_jsx("span", { className: "text-xs text-accent2", children: "Venice oracle \u2713" }))] })), chatSession?.isExpired && (_jsxs("div", { className: "px-4 py-2 bg-danger/10 border-b border-danger/20 flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-danger", children: "Session expired \u2014 re-authorize to continue" }), _jsx("button", { onClick: () => setShowAuthorize(true), className: "text-xs text-danger underline", children: "Renew" })] })), _jsxs("div", { ref: threadRef, className: "flex-1 overflow-y-auto px-4 py-4 space-y-4", children: [messages.length === 0 && (_jsx(EmptyState, { hasSession: !!chatSession && !chatSession.isExpired, chatName: activeChat?.name ?? 'New Chat', onAuthorize: () => setShowAuthorize(true), onExampleClick: (ex) => { setInput(ex); inputRef.current?.focus(); } })), messages.map((msg) => (_jsx(MessageBubble, { message: msg, getTask: getTask }, msg.id)))] }), _jsx("div", { className: "px-5 pb-5 pt-3 border-t border-white/[0.06] shrink-0", children: !address ? (_jsx("div", { className: "text-center py-3 text-sm text-muted", children: "Connect MetaMask to start" })) : !chatSession || chatSession.isExpired ? (_jsxs("div", { className: "flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm text-text font-medium", children: activeChat?.name ?? 'New Chat' }), _jsx("div", { className: "text-xs text-muted mt-0.5", children: "Authorize agents to start \u00B7 each chat has its own budget" })] }), _jsx("button", { onClick: () => setShowAuthorize(true), className: "px-4 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors shrink-0", children: "Authorize \u2192" })] })) : (_jsxs("div", { className: "space-y-2.5", children: [planPreview?.hasUserAgents && !agentChoice && !isSubmitting && (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => handleAgentChoiceReply('user'), className: "flex-1 py-2 rounded-xl text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors", children: "1. Use my agents" }), _jsx("button", { onClick: () => handleAgentChoiceReply('system'), className: "flex-1 py-2 rounded-xl text-xs font-medium bg-white/[0.03] border border-white/[0.08] text-muted hover:text-text transition-colors", children: "2. Auto-select" }), _jsx("button", { onClick: () => handleAgentChoiceReply('mix'), className: "flex-1 py-2 rounded-xl text-xs font-medium bg-white/[0.03] border border-white/[0.08] text-muted hover:text-text transition-colors", children: "3. Mix" })] })), _jsxs("div", { className: "relative flex items-end gap-2", children: [_jsx("textarea", { ref: inputRef, value: input, onChange: (e) => setInput(e.target.value), onKeyDown: handleKeyDown, placeholder: `Message ${activeChat?.name ?? 'agents'}…`, rows: 1, className: "flex-1 resize-none bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-text placeholder-muted focus:outline-none focus:border-accent/40 focus:bg-white/[0.05] transition-all max-h-32 overflow-y-auto", style: { minHeight: '48px' }, onInput: (e) => {
                                                const el = e.currentTarget;
                                                el.style.height = 'auto';
                                                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
                                            } }), _jsx("button", { onClick: handleScheduleClick, title: "Schedule", className: "w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-accent/30 text-muted hover:text-accent flex items-center justify-center transition-colors shrink-0", children: _jsxs("svg", { width: "15", height: "15", viewBox: "0 0 15 15", fill: "none", children: [_jsx("circle", { cx: "7.5", cy: "7.5", r: "6", stroke: "currentColor", strokeWidth: "1.2" }), _jsx("path", { d: "M7.5 4.5V7.5L9.5 9.5", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" })] }) }), _jsx("button", { onClick: handleSubmit, disabled: !input.trim() || isSubmitting || isPlanning, className: "w-11 h-11 rounded-2xl bg-white hover:bg-white/90 disabled:bg-white/[0.08] disabled:cursor-not-allowed text-black flex items-center justify-center transition-colors shrink-0", children: isSubmitting || isPlanning ? (_jsxs("svg", { className: "animate-spin w-4 h-4", viewBox: "0 0 16 16", fill: "none", children: [_jsx("circle", { cx: "8", cy: "8", r: "6", stroke: "currentColor", strokeWidth: "1.5", strokeOpacity: "0.3" }), _jsx("path", { d: "M8 2A6 6 0 0 1 14 8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] })) : (_jsx("svg", { width: "15", height: "15", viewBox: "0 0 15 15", fill: "none", children: _jsx("path", { d: "M13 7.5L2 2L4.5 7.5L2 13L13 7.5Z", fill: "currentColor" }) })) })] }), _jsx("p", { className: "text-xs text-muted text-center", children: "Enter to send \u00B7 \u23F0 schedule \u00B7 each chat has its own budget" })] })) })] }), showAuthorize && (_jsx(AuthorizeModal, { chatId: chatId, chatName: activeChat?.name, onClose: () => setShowAuthorize(false), onAuthorized: (session) => {
                    setShowAuthorize(false);
                    setChatSession(chatId, { ...session, isExpired: false });
                    if (pendingPrompt)
                        executeTask(pendingPrompt, planPreview, agentChoice ?? agentPreference);
                } })), showSchedule && (_jsx(ScheduleModal, { prompt: schedulePrompt, onClose: () => setShowSchedule(false), onScheduled: (name, schedule) => {
                    addChatMessage(chatId, {
                        id: randomUUID(), type: 'system',
                        content: `⏰ Scheduled: **${name}** — ${schedule}`,
                        createdAt: Date.now(),
                    });
                } }))] }));
}
// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message, getTask }) {
    const task = message.taskId ? getTask(message.taskId) : undefined;
    if (message.type === 'user') {
        return (_jsx("div", { className: "flex justify-end", children: _jsx("div", { className: "max-w-lg px-4 py-2.5 rounded-2xl rounded-tr-md bg-[#1e1e22] text-white text-sm border border-white/[0.06]", children: message.content }) }));
    }
    if (message.type === 'system') {
        return (_jsx("div", { className: "flex justify-center", children: _jsx("div", { className: "px-3 py-2 rounded-xl bg-surface border border-border text-xs text-muted max-w-lg w-full", children: _jsx(MessageThread, { content: message.content }) }) }));
    }
    const isAutonomous = message.type === 'autonomous';
    return (_jsx("div", { className: "flex justify-start", children: _jsxs("div", { className: "max-w-2xl w-full space-y-2", children: [isAutonomous && (_jsxs("div", { className: "flex items-center gap-2 text-xs text-muted", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-accent2 animate-pulse" }), _jsx("span", { className: "text-accent2 font-medium", children: "\uD83E\uDD16 Autonomous" }), message.scheduledBy && _jsxs("span", { children: ["\u00B7 ", message.scheduledBy] }), message.triggeredBy && _jsxs("span", { children: ["\u00B7 ", message.triggeredBy] })] })), (task?.delegationSteps?.length ?? message.delegationSteps?.length ?? 0) > 0 && (_jsx(DelegationGraph, { steps: task?.delegationSteps ?? message.delegationSteps ?? [], taskId: message.taskId ?? '' })), message.status === 'running' && !message.content && (_jsxs("div", { className: "flex items-center gap-2 text-xs text-muted px-1", children: [_jsx("div", { className: "flex gap-1", children: [0, 150, 300].map((d) => (_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-accent animate-bounce", style: { animationDelay: `${d}ms` } }, d))) }), _jsx("span", { children: "Agents working\u2026" })] })), message.content && message.status !== 'running' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: `card px-4 py-3 ${message.isPrivate ? 'border-accent2/20' : ''}`, children: [message.isPrivate && (_jsxs("div", { className: "flex items-center gap-1.5 mb-2 text-xs text-accent2", children: [_jsx("span", { children: "\uD83D\uDD12" }), _jsx("span", { children: "Venice TEE \u2014 private inference" })] })), _jsx(MessageThread, { content: message.content })] }), message.audioUrl && _jsx(AudioPlayer, { audioUrl: message.audioUrl }), message.txDetails && message.txDetails.length > 0 && (_jsxs("details", { className: "text-xs text-muted border border-border rounded-lg overflow-hidden", children: [_jsxs("summary", { className: "px-3 py-2 cursor-pointer hover:bg-surface/50 flex items-center justify-between", children: [_jsx("span", { className: "font-medium text-foreground/70", children: "Transaction Details" }), _jsxs("span", { className: "font-mono text-accent", children: ["$", message.totalSpentUsdc, " USDC spent"] })] }), _jsx("div", { className: "px-3 pb-3 space-y-1.5 border-t border-border pt-2", children: message.txDetails.map((tx, i) => (_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "capitalize text-foreground/60 w-24", children: tx.agentName === 'executor' && tx.hasTransfer ? 'executor + transfer' : tx.agentName }), _jsxs("span", { className: "text-accent font-mono", children: ["$", tx.feeUsdc.toFixed(2)] }), _jsxs("a", { href: `https://basescan.org/tx/${tx.oneShotTaskId}`, target: "_blank", rel: "noopener noreferrer", className: "font-mono text-accent/70 hover:text-accent truncate flex-1 text-right", children: [tx.oneShotTaskId.slice(0, 10), "...", tx.oneShotTaskId.slice(-6), " \u2197"] })] }, i))) })] })), _jsxs("div", { className: "flex items-center gap-3 text-xs text-muted px-1", children: [_jsx("span", { className: "font-mono", children: message.taskId?.slice(0, 8) }), _jsx("span", { children: "\u00B7" }), _jsx("span", { children: new Date(message.createdAt).toLocaleTimeString() }), _jsx("button", { onClick: () => navigator.clipboard.writeText(message.content), className: "ml-auto text-muted hover:text-accent transition-colors", title: "Copy", children: _jsxs("svg", { width: "11", height: "11", viewBox: "0 0 11 11", fill: "none", children: [_jsx("rect", { x: "1", y: "3", width: "7", height: "7", rx: "1", stroke: "currentColor", strokeWidth: "1" }), _jsx("path", { d: "M3 3V2C3 1.45 3.45 1 4 1H9C9.55 1 10 1.45 10 2V7C10 7.55 9.55 8 9 8H8", stroke: "currentColor", strokeWidth: "1" })] }) })] })] })), message.status === 'failed' && message.content && (_jsx("div", { className: "card px-4 py-3 border-danger/30 bg-danger/5", children: _jsx("p", { className: "text-sm text-danger", children: message.content }) }))] }) }));
}
// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ hasSession, chatName, onAuthorize, onExampleClick }) {
    const examples = [
        'Analyze ETH price and suggest entry points',
        'Research top DeFi protocols by TVL this week',
        'Watch wallet 0x1234... and alert on activity',
        'Audit Uniswap v4 risks before deploying',
    ];
    return (_jsxs("div", { className: "flex flex-col items-center justify-center h-full py-16 text-center", children: [_jsx("h3", { className: "font-display font-semibold text-text text-base mb-1", children: chatName }), _jsx("p", { className: "text-sm text-muted max-w-sm mb-6", children: hasSession
                    ? 'Ask anything. This chat has its own budget and agent settings.'
                    : 'Authorize this chat to get started. Each chat has its own budget and agent requirements.' }), !hasSession && (_jsx("button", { onClick: onAuthorize, className: "px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors mb-6", children: "Authorize Chat \u2192" })), _jsx("div", { className: "grid grid-cols-2 gap-2 max-w-lg", children: examples.map((ex) => (_jsx("button", { onClick: () => onExampleClick(ex), className: "px-3 py-2.5 rounded-lg bg-surface border border-border text-left text-xs text-muted hover:text-text hover:border-accent/30 transition-colors", children: ex }, ex))) })] }));
}
// ── Helpers ───────────────────────────────────────────────────────────────────
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
function buildPlanMessage(plan) {
    const parts = [];
    if (plan.requiresTEE)
        parts.push(`🔒 **Private** (${plan.privacyCategories.join(', ')}) — routing to Venice TEE`);
    parts.push(`**Agents:** ${plan.suggestedAgents.join(' → ')}`);
    if (plan.hasUserAgents && plan.agentChoiceMessage)
        parts.push('\n' + plan.agentChoiceMessage);
    return parts.join('\n');
}
