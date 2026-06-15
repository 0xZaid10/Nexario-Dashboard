import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentRequirement {
  minReputation?: number
  minRevenue?: number
  maxBudget?: number
  requiredTrust?: string[]
}

export interface ChatSession {
  sessionId: string
  chatId: string
  budgetUsdc: number
  remainingUsdc: number
  spentUsdc: number
  expiresAt: number
  allowedActions: string[]
  agentRequirements: Record<string, AgentRequirement>
  veniceQualityOracle: boolean
  permissionsContext: string
  delegationManager: string
  isExpired: boolean
}

// Legacy — kept for backward compat
export type Session = ChatSession

export type MessageType = 'user' | 'agent' | 'autonomous' | 'system'

export interface ChatMessage {
  id: string
  type: MessageType
  content: string
  taskId?: string
  scheduledBy?: string
  triggeredBy?: string
  isPrivate?: boolean
  audioUrl?: string
  txDetails?: Array<{ agentName: string; oneShotTaskId: string; feeUsdc: number }>
  totalSpentUsdc?: string
  delegationSteps?: DelegationStep[]
  status?: 'running' | 'completed' | 'failed'
  createdAt: number
}

export interface ChatThread {
  chatId: string
  name: string
  description?: string
  session: ChatSession | null
  messages: ChatMessage[]
  taskIds: string[]        // task IDs in this chat
  createdAt: number
  lastActiveAt: number
  preferredAgentIds: number[]
  agentPreference: 'user' | 'system' | 'mix'
}

export interface TaskHistoryItem {
  taskId: string
  chatId?: string
  prompt: string
  status: 'running' | 'completed' | 'failed'
  createdAt: number
  result?: string
  audioUrl?: string
  delegationSteps?: DelegationStep[]
  totalSpent?: number
}

export interface DelegationStep {
  stepId: string
  agentName: string
  agentId: number
  status: 'pending' | 'planning' | 'delegating' | 'executing' | 'confirmed' | 'blocked' | 'failed'
  txHash?: string
  blockNumber?: number
  budgetAllocated?: number
  budgetUsed?: number
  reputationScore?: number
  output?: string
  errorMessage?: string
  startedAt?: number
  confirmedAt?: number
}

// ── Store interface ───────────────────────────────────────────────────────────

interface SessionStore {
  // Wallet
  userAddress: string | null
  setUserAddress: (addr: string | null) => void

  // Per-chat threads — the core data structure
  chats: Record<string, ChatThread>    // chatId → ChatThread
  activeChatId: string | null          // currently open chat

  // Chat CRUD
  createChat: (name?: string, chatId?: string) => string
  setActiveChat: (chatId: string) => void
  renameChat: (chatId: string, name: string) => void
  deleteChat: (chatId: string) => void
  getChat: (chatId: string) => ChatThread | undefined
  getActiveChat: () => ChatThread | undefined

  // Session (per chat)
  setChatSession: (chatId: string, session: ChatSession | null) => void
  deductChatBudget: (chatId: string, amount: number) => void

  // Messages (per chat)
  addChatMessage: (chatId: string, msg: ChatMessage) => void
  updateChatSession: (chatId: string, updates: Partial<ChatSession>) => void
  updateChatMessage: (chatId: string, msgId: string, updates: Partial<ChatMessage>) => void
  clearChatMessages: (chatId: string) => void

  // Agent preferences (per chat)
  addPreferredAgent: (chatId: string, agentId: number) => void
  removePreferredAgent: (chatId: string, agentId: number) => void
  setAgentPreference: (chatId: string, pref: 'user' | 'system' | 'mix') => void

  // Task history (global, cross-chat)
  taskHistory: TaskHistoryItem[]
  addTask: (task: TaskHistoryItem) => void
  updateTask: (taskId: string, updates: Partial<TaskHistoryItem>) => void
  updateDelegationStep: (taskId: string, stepId: string, updates: Partial<DelegationStep>) => void
  getTask: (taskId: string) => TaskHistoryItem | undefined

  // Legacy compat (uses activeChatId)
  session: ChatSession | null
  setSession: (s: ChatSession | null) => void
  chatThread: ChatMessage[]
  preferredAgentIds: number[]
  agentPreference: 'user' | 'system' | 'mix'
  clearChatThread: () => void

  // Settings
  apiKey: string
  setApiKey: (k: string) => void
  defaultMinReputation: number
  setDefaultMinReputation: (v: number) => void
  veniceQualityOracle: boolean
  setVeniceQualityOracle: (v: boolean) => void
}

// ── Store implementation ──────────────────────────────────────────────────────

function newChat(name = 'New Chat', existingChatId?: string): ChatThread {
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
  }
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      userAddress: null,
      setUserAddress: (addr) => set({ userAddress: addr }),

      chats: {},
      activeChatId: null,

      createChat: (name, existingChatId?: string) => {
        const chat = newChat(name, existingChatId)
        set((state) => ({
          chats: { ...state.chats, [chat.chatId]: chat },
          activeChatId: chat.chatId,
        }))
        return chat.chatId
      },

      setActiveChat: (chatId) => {
        const { chats } = get()
        if (!chats[chatId]) return
        set({ activeChatId: chatId })
      },

      renameChat: (chatId, name) => set((state) => ({
        chats: {
          ...state.chats,
          [chatId]: { ...state.chats[chatId]!, name },
        },
      })),

      deleteChat: (chatId) => set((state) => {
        const { [chatId]: _removed, ...rest } = state.chats
        const newActiveId = Object.keys(rest)[0] ?? null
        return { chats: rest, activeChatId: newActiveId }
      }),

      getChat: (chatId) => get().chats[chatId],

      getActiveChat: () => {
        const { chats, activeChatId } = get()
        return activeChatId ? chats[activeChatId] : undefined
      },

      setChatSession: (chatId, session) => set((state) => ({
        chats: {
          ...state.chats,
          [chatId]: { ...state.chats[chatId]!, session },
        },
      })),

      deductChatBudget: (chatId, amount) => set((state) => {
        const chat = state.chats[chatId]
        if (!chat?.session) return state
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
        }
      }),

      addChatMessage: (chatId, msg) => set((state) => {
        const chat = state.chats[chatId]
        if (!chat) return state
        return {
          chats: {
            ...state.chats,
            [chatId]: {
              ...chat,
              messages: [...chat.messages, msg],
              lastActiveAt: Date.now(),
            },
          },
        }
      }),

      updateChatSession: (chatId, sessionUpdates) => set((state) => {
        const chat = state.chats[chatId]
        if (!chat?.session) return state
        return {
          chats: {
            ...state.chats,
            [chatId]: {
              ...chat,
              session: { ...chat.session, ...sessionUpdates },
            },
          },
        }
      }),
      updateChatMessage: (chatId, msgId, updates) => set((state) => {
        const chat = state.chats[chatId]
        if (!chat) return state
        return {
          chats: {
            ...state.chats,
            [chatId]: {
              ...chat,
              messages: chat.messages.map((m) =>
                m.id === msgId ? { ...m, ...updates } : m
              ),
            },
          },
        }
      }),

      clearChatMessages: (chatId) => set((state) => ({
        chats: {
          ...state.chats,
          [chatId]: { ...state.chats[chatId]!, messages: [] },
        },
      })),

      addPreferredAgent: (chatId, agentId) => set((state) => {
        const chat = state.chats[chatId]
        if (!chat) return state
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
        }
      }),

      removePreferredAgent: (chatId, agentId) => set((state) => {
        const chat = state.chats[chatId]
        if (!chat) return state
        return {
          chats: {
            ...state.chats,
            [chatId]: {
              ...chat,
              preferredAgentIds: chat.preferredAgentIds.filter((id) => id !== agentId),
            },
          },
        }
      }),

      setAgentPreference: (chatId, pref) => set((state) => ({
        chats: {
          ...state.chats,
          [chatId]: { ...state.chats[chatId]!, agentPreference: pref },
        },
      })),

      // Task history — global
      taskHistory: [],
      addTask: (task) => set((state) => ({
        taskHistory: [task, ...state.taskHistory].slice(0, 100),
      })),
      updateTask: (taskId, updates) => set((state) => ({
        taskHistory: state.taskHistory.map((t) =>
          t.taskId === taskId ? { ...t, ...updates } : t
        ),
      })),
      updateDelegationStep: (taskId, stepId, updates) => set((state) => ({
        taskHistory: state.taskHistory.map((t) => {
          if (t.taskId !== taskId) return t
          const steps = t.delegationSteps ?? []
          const exists = steps.some((s) => s.stepId === stepId)
          return {
            ...t,
            delegationSteps: exists
              ? steps.map((s) => s.stepId === stepId ? { ...s, ...updates } : s)
              : [...steps, { stepId, agentName: '', agentId: 0, status: 'pending', ...updates }],
          }
        }),
      })),
      getTask: (taskId) => get().taskHistory.find((t) => t.taskId === taskId),

      // Legacy compat — proxy to activeChatId
      get session() {
        const { chats, activeChatId } = get()
        return activeChatId ? (chats[activeChatId]?.session ?? null) : null
      },
      setSession: (s) => {
        const { activeChatId } = get()
        if (activeChatId) get().setChatSession(activeChatId, s)
      },
      get chatThread() {
        const { chats, activeChatId } = get()
        return activeChatId ? (chats[activeChatId]?.messages ?? []) : []
      },
      get preferredAgentIds() {
        const { chats, activeChatId } = get()
        return activeChatId ? (chats[activeChatId]?.preferredAgentIds ?? []) : []
      },
      get agentPreference() {
        const { chats, activeChatId } = get()
        return activeChatId ? (chats[activeChatId]?.agentPreference ?? 'mix') : 'mix'
      },
      clearChatThread: () => {
        const { activeChatId } = get()
        if (activeChatId) get().clearChatMessages(activeChatId)
      },

      // Settings
      apiKey: 'nexario-dev-key-change-in-prod',
      setApiKey: (k) => set({ apiKey: k }),
      defaultMinReputation: 80,
      setDefaultMinReputation: (v) => set({ defaultMinReputation: v }),
      veniceQualityOracle: false,
      setVeniceQualityOracle: (v) => set({ veniceQualityOracle: v }),
    }),
    {
      name: 'nexario-session-v2',  // new key — clears old localStorage
      partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
        taskHistory: state.taskHistory,
        apiKey: state.apiKey,
        defaultMinReputation: state.defaultMinReputation,
        veniceQualityOracle: state.veniceQualityOracle,
      }),
      merge: (persisted: any, current) => {
        // Fix any chats with missing messages array from old persisted state
        const chats = persisted?.chats ?? {}
        Object.keys(chats).forEach(id => {
          if (!chats[id].messages) chats[id].messages = []
          if (!chats[id].taskIds) chats[id].taskIds = []
          if (!chats[id].preferredAgentIds) chats[id].preferredAgentIds = []
        })
        return { ...current, ...persisted, chats }
      },
    }
  )
)
