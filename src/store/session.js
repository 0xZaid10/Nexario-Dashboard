import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// ── Store implementation ──────────────────────────────────────────────────────
function newChat(name = 'New Chat', existingChatId) {
    return {
        chatId: existingChatId ?? crypto.randomUUID(),
        name,
        session: null,
        messages: [],
        taskIds: [],
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        preferredAgentIds: [],
        agentPreference: 'mix',
    };
}
export const useSessionStore = create()(persist((set, get) => ({
    userAddress: null,
    setUserAddress: (addr) => set({ userAddress: addr }),
    chats: {},
    activeChatId: null,
    createChat: (name, existingChatId) => {
        const chat = newChat(name, existingChatId);
        set((state) => ({
            chats: { ...state.chats, [chat.chatId]: chat },
            activeChatId: chat.chatId,
        }));
        return chat.chatId;
    },
    setActiveChat: (chatId) => {
        const { chats } = get();
        if (!chats[chatId])
            return;
        set({ activeChatId: chatId });
    },
    renameChat: (chatId, name) => set((state) => ({
        chats: {
            ...state.chats,
            [chatId]: { ...state.chats[chatId], name },
        },
    })),
    deleteChat: (chatId) => set((state) => {
        const { [chatId]: _removed, ...rest } = state.chats;
        const newActiveId = Object.keys(rest)[0] ?? null;
        return { chats: rest, activeChatId: newActiveId };
    }),
    getChat: (chatId) => get().chats[chatId],
    getActiveChat: () => {
        const { chats, activeChatId } = get();
        return activeChatId ? chats[activeChatId] : undefined;
    },
    setChatSession: (chatId, session) => set((state) => ({
        chats: {
            ...state.chats,
            [chatId]: { ...state.chats[chatId], session },
        },
    })),
    deductChatBudget: (chatId, amount) => set((state) => {
        const chat = state.chats[chatId];
        if (!chat?.session)
            return state;
        return {
            chats: {
                ...state.chats,
                [chatId]: {
                    ...chat,
                    session: {
                        ...chat.session,
                        remainingUsdc: Math.max(0, chat.session.remainingUsdc - amount),
                        spentUsdc: chat.session.spentUsdc + amount,
                    },
                },
            },
        };
    }),
    addChatMessage: (chatId, msg) => set((state) => {
        const chat = state.chats[chatId];
        if (!chat)
            return state;
        return {
            chats: {
                ...state.chats,
                [chatId]: {
                    ...chat,
                    messages: [...chat.messages, msg],
                    lastActiveAt: Date.now(),
                },
            },
        };
    }),
    updateChatSession: (chatId, sessionUpdates) => set((state) => {
        const chat = state.chats[chatId];
        if (!chat?.session)
            return state;
        return {
            chats: {
                ...state.chats,
                [chatId]: {
                    ...chat,
                    session: { ...chat.session, ...sessionUpdates },
                },
            },
        };
    }),
    updateChatMessage: (chatId, msgId, updates) => set((state) => {
        const chat = state.chats[chatId];
        if (!chat)
            return state;
        return {
            chats: {
                ...state.chats,
                [chatId]: {
                    ...chat,
                    messages: chat.messages.map((m) => m.id === msgId ? { ...m, ...updates } : m),
                },
            },
        };
    }),
    clearChatMessages: (chatId) => set((state) => ({
        chats: {
            ...state.chats,
            [chatId]: { ...state.chats[chatId], messages: [] },
        },
    })),
    addPreferredAgent: (chatId, agentId) => set((state) => {
        const chat = state.chats[chatId];
        if (!chat)
            return state;
        return {
            chats: {
                ...state.chats,
                [chatId]: {
                    ...chat,
                    preferredAgentIds: chat.preferredAgentIds.includes(agentId)
                        ? chat.preferredAgentIds
                        : [...chat.preferredAgentIds, agentId],
                },
            },
        };
    }),
    removePreferredAgent: (chatId, agentId) => set((state) => {
        const chat = state.chats[chatId];
        if (!chat)
            return state;
        return {
            chats: {
                ...state.chats,
                [chatId]: {
                    ...chat,
                    preferredAgentIds: chat.preferredAgentIds.filter((id) => id !== agentId),
                },
            },
        };
    }),
    setAgentPreference: (chatId, pref) => set((state) => ({
        chats: {
            ...state.chats,
            [chatId]: { ...state.chats[chatId], agentPreference: pref },
        },
    })),
    // Task history — global
    taskHistory: [],
    addTask: (task) => set((state) => ({
        taskHistory: [task, ...state.taskHistory].slice(0, 100),
    })),
    updateTask: (taskId, updates) => set((state) => ({
        taskHistory: state.taskHistory.map((t) => t.taskId === taskId ? { ...t, ...updates } : t),
    })),
    updateDelegationStep: (taskId, stepId, updates) => set((state) => ({
        taskHistory: state.taskHistory.map((t) => {
            if (t.taskId !== taskId)
                return t;
            const steps = t.delegationSteps ?? [];
            const exists = steps.some((s) => s.stepId === stepId);
            return {
                ...t,
                delegationSteps: exists
                    ? steps.map((s) => s.stepId === stepId ? { ...s, ...updates } : s)
                    : [...steps, { stepId, agentName: '', agentId: 0, status: 'pending', ...updates }],
            };
        }),
    })),
    getTask: (taskId) => get().taskHistory.find((t) => t.taskId === taskId),
    // Legacy compat — proxy to activeChatId
    get session() {
        const { chats, activeChatId } = get();
        return activeChatId ? (chats[activeChatId]?.session ?? null) : null;
    },
    setSession: (s) => {
        const { activeChatId } = get();
        if (activeChatId)
            get().setChatSession(activeChatId, s);
    },
    get chatThread() {
        const { chats, activeChatId } = get();
        return activeChatId ? (chats[activeChatId]?.messages ?? []) : [];
    },
    get preferredAgentIds() {
        const { chats, activeChatId } = get();
        return activeChatId ? (chats[activeChatId]?.preferredAgentIds ?? []) : [];
    },
    get agentPreference() {
        const { chats, activeChatId } = get();
        return activeChatId ? (chats[activeChatId]?.agentPreference ?? 'mix') : 'mix';
    },
    clearChatThread: () => {
        const { activeChatId } = get();
        if (activeChatId)
            get().clearChatMessages(activeChatId);
    },
    // Settings
    apiKey: 'nexario-dev-key-change-in-prod',
    setApiKey: (k) => set({ apiKey: k }),
    defaultMinReputation: 80,
    setDefaultMinReputation: (v) => set({ defaultMinReputation: v }),
    veniceQualityOracle: false,
    setVeniceQualityOracle: (v) => set({ veniceQualityOracle: v }),
}), {
    name: 'nexario-session-v2', // new key — clears old localStorage
    partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
        taskHistory: state.taskHistory,
        apiKey: state.apiKey,
        defaultMinReputation: state.defaultMinReputation,
        veniceQualityOracle: state.veniceQualityOracle,
    }),
    merge: (persisted, current) => {
        // Fix any chats with missing messages array from old persisted state
        const chats = persisted?.chats ?? {};
        Object.keys(chats).forEach(id => {
            if (!chats[id].messages)
                chats[id].messages = [];
            if (!chats[id].taskIds)
                chats[id].taskIds = [];
            if (!chats[id].preferredAgentIds)
                chats[id].preferredAgentIds = [];
        });
        return { ...current, ...persisted, chats };
    },
}));
