import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ChatView from './views/ChatView'
import AgentsView from './views/AgentsView'
import LeaseView from './views/LeaseView'
import DashboardView from './views/DashboardView'
import { useSessionStore } from './store/session'
import { fetchChats } from './lib/api'
import { useAccount } from 'wagmi'

export type View = 'dashboard' | 'chat' | 'agents' | 'lease'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { chats, activeChatId, createChat, setActiveChat, setChatSession } = useSessionStore()
  const apiKey = useSessionStore(s => s.apiKey)
  const setUserAddress = useSessionStore(s => s.setUserAddress)
  const { address: wagmiAddress } = useAccount()
  const userAddress = wagmiAddress ?? null

  // Sync wagmi address to store
  useEffect(() => {
    setUserAddress(wagmiAddress ?? null)
  }, [wagmiAddress]) // eslint-disable-line

  // Ensure at least one chat exists — only on first load
  useEffect(() => {
    const state = useSessionStore.getState()

    // Load chat history from backend if user is connected
    if (userAddress) {
      // Wait for Zustand hydration before fetching — prevents overwriting localStorage data
      const doFetch = () => {
      fetchChats(userAddress, apiKey).then(({ threads }) => {
        const currentState = useSessionStore.getState()
        threads.forEach(thread => {
          const existingChat = currentState.chats[thread.chatId]
          if (!existingChat) {
            // Chat not in localStorage — create it
            currentState.createChat(thread.name, thread.chatId)
          }
          // Restore full session from backend — permissionsContext now included
          if (thread.session && !thread.session.isExpired && thread.session.permissionsContext) {
            currentState.setChatSession(thread.chatId, {
              sessionId: thread.session.sessionId ?? '',
              chatId: thread.chatId,
              budgetUsdc: thread.session.budgetUsdc,
              remainingUsdc: thread.session.remainingUsdc,
              spentUsdc: thread.session.spentUsdc,
              expiresAt: thread.session.expiresAt,
              allowedActions: thread.session.allowedActions ?? ['research', 'audit', 'report'],
              agentRequirements: thread.session.agentRequirements ?? {},
              veniceQualityOracle: thread.session.veniceQualityOracle ?? true,
              permissionsContext: thread.session.permissionsContext,
              delegationManager: thread.session.delegationManager ?? '',
              isExpired: false,
            })
          } else if (thread.session?.isExpired) {
            currentState.updateChatSession(thread.chatId, { isExpired: true })
          }
        })
        // Set active chat to most recent if none set
        if (!currentState.activeChatId && threads.length > 0) {
          currentState.setActiveChat(threads[0].chatId)
        }
      }).catch(() => {
        // If fetch fails, ensure at least one chat exists
        if (Object.keys(useSessionStore.getState().chats).length === 0) {
          useSessionStore.getState().createChat('New Chat')
        }
      })
      } // end doFetch
      // Poll until Zustand has hydrated AND has the persisted chats loaded
      // We know hydration is complete when activeChatId is set or chats have sessions
      const waitAndFetch = () => {
        const state = useSessionStore.getState()
        const chats = state.chats
        const hasHydratedSessions = Object.values(chats).some(c => c.session !== null)
        const hasManyChats = Object.keys(chats).length > 1
        if (hasHydratedSessions || hasManyChats || document.readyState !== 'loading') {
          doFetch()
        } else {
          setTimeout(waitAndFetch, 100)
        }
      }
      setTimeout(waitAndFetch, 300)
    } else {
      // No wallet — just ensure valid state after hydration
      setTimeout(() => {
        const s = useSessionStore.getState()
        if (Object.keys(s.chats).length === 0) {
          s.createChat('New Chat')
        } else if (!s.activeChatId || !s.chats[s.activeChatId]) {
          const firstId = Object.keys(s.chats)[0]
          if (firstId) s.setActiveChat(firstId)
        }
      }, 200)
    }
  }, [userAddress]) // reload chats when wallet connects

  const activeView: View =
    location.pathname === '/' ? 'dashboard'
    : location.pathname.startsWith('/chat') ? 'chat'
    : location.pathname === '/agents' ? 'agents'
    : location.pathname === '/lease' ? 'lease'
    : 'dashboard'

  function handleNavigate(v: View) {
    navigate(v === 'dashboard' ? '/' : `/${v}`)
  }

  function handleOpenTask(taskId: string) {
    // Find which chat has this task
    const { taskHistory } = useSessionStore.getState()
    const task = taskHistory.find(t => t.taskId === taskId)
    if (task?.chatId) {
      setActiveChat(task.chatId)
    }
    navigate('/chat')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        onOpenTask={handleOpenTask}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<DashboardView onNewChat={() => navigate('/chat')} />} />
            <Route path="/chat" element={<ChatView />} />
            <Route path="/agents" element={<AgentsView />} />
            <Route path="/lease" element={<LeaseView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
