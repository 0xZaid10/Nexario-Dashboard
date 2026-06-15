import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/session'
import type { View } from '../App'

interface Props {
  activeView: View
  onNavigate: (v: View) => void
  onOpenTask: (taskId: string) => void
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: GridIcon },
  { id: 'agents',    label: 'Agents',    icon: AgentsIcon },
  { id: 'lease',     label: 'Leasing',   icon: LeaseIcon },
] as const

export default function Sidebar({ activeView, onNavigate, onOpenTask }: Props) {
  const navigate = useNavigate()
  const {
    chats, activeChatId, createChat, setActiveChat, renameChat, deleteChat,
  } = useSessionStore()
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function handleNewChat() {
    const chatId = createChat('New Chat')
    navigate('/chat')
  }

  function handleOpenChat(chatId: string) {
    setActiveChat(chatId)
    navigate('/chat')
  }

  function handleRenameStart(chatId: string, currentName: string, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingChatId(chatId)
    setEditName(currentName)
  }

  function handleRenameSubmit(chatId: string) {
    if (editName.trim()) renameChat(chatId, editName.trim())
    setEditingChatId(null)
  }

  // Sort chats by lastActiveAt desc
  const sortedChats = Object.values(chats).sort((a, b) => b.lastActiveAt - a.lastActiveAt)

  return (
    <aside className="flex flex-col w-60 shrink-0 border-r border-white/[0.06]" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

      {/* Logo */}
      <div className="flex items-center px-5 py-5 border-b border-white/[0.05]">
        <span className="font-display font-bold text-xl text-text tracking-wide">Nexario</span>
      </div>

      {/* Nav */}
      <nav className="px-2.5 py-3 border-b border-white/[0.05]">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id as View)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
              activeView === id
                ? 'bg-white/[0.08] text-white font-medium'
                : 'text-muted hover:text-text hover:bg-white/[0.04]'
            }`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Chat threads */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 min-h-0">
        <div className="flex items-center justify-between px-2 py-1 mb-1.5">
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">Chats</span>
          <button
            onClick={handleNewChat}
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            + New
          </button>
        </div>

        {sortedChats.length === 0 ? (
          <div className="px-2 py-4 text-center">
            <div className="text-xs text-muted">No chats yet</div>
            <button onClick={handleNewChat} className="text-xs text-accent hover:underline mt-1">
              Start a chat →
            </button>
          </div>
        ) : (
          sortedChats.map((chat) => {
            const isActive = chat.chatId === activeChatId
            const session = chat.session
            const isExpired = session ? (session.expiresAt * 1000 < Date.now() || session.isExpired) : false
            const remaining = session?.remainingUsdc ?? 0

            return (
              <div
                key={chat.chatId}
                className={`group relative mb-0.5 rounded-md transition-colors cursor-pointer ${
                  isActive ? 'bg-white/[0.07] border border-white/[0.10]' : 'hover:bg-white/[0.04]'
                }`}
                onClick={() => handleOpenChat(chat.chatId)}
              >
                <div className="px-2.5 py-2">
                  {editingChatId === chat.chatId ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRenameSubmit(chat.chatId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit(chat.chatId)
                        if (e.key === 'Escape') setEditingChatId(null)
                        e.stopPropagation()
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full bg-transparent text-xs text-text border-b border-white/20 outline-none pb-0.5"
                    />
                  ) : (
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs truncate flex-1 ${isActive ? 'text-white font-medium' : 'text-text'}`}>
                        {chat.name}
                      </span>
                      <button
                        onClick={(e) => handleRenameStart(chat.chatId, chat.name, e)}
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-text transition-all text-xs"
                      >
                        ✎
                      </button>
                    </div>
                  )}

                  {/* Session budget indicator */}
                  {session && !isExpired && (
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span className="text-xs text-muted">
                          ${remaining.toFixed(2)} left
                        </span>
                      </div>
                      <span className="text-xs text-muted font-mono">
                        {formatExpiry(session.expiresAt)}
                      </span>
                    </div>
                  )}
                  {session && isExpired && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-danger" />
                      <span className="text-xs text-danger">Expired</span>
                    </div>
                  )}
                  {!session && (
                    <div className="text-xs text-muted mt-0.5">No authorization</div>
                  )}

                  {/* Message count */}
                  {(chat.messages?.length ?? 0) > 0 && (
                    <div className="text-xs text-muted mt-0.5">
                      {(chat.messages?.filter(m => m.type === 'user').length ?? 0)} message{(chat.messages?.filter(m => m.type === 'user').length ?? 0) !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom — chain indicators */}
      <div className="px-4 py-3 border-t border-white/[0.05] space-y-1.5">
        <ChainIndicator label="Contracts" chain="Base" color="accent" />
        <ChainIndicator label="Relay" chain="1Shot" color="success" />
        <ChainIndicator label="AI" chain="Venice" color="accent2" />
      </div>
    </aside>
  )
}

function formatExpiry(expiresAt: number): string {
  const diff = expiresAt - Math.floor(Date.now() / 1000)
  if (diff <= 0) return 'expired'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function ChainIndicator({ label, chain, color }: { label: string; chain: string; color: string }) {
  const dotColor = color === 'accent' ? 'bg-accent' : color === 'accent2' ? 'bg-accent2' : 'bg-success'
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <div className="flex items-center gap-1">
        <div className={`w-1 h-1 rounded-full ${dotColor}`} />
        <span className="text-xs text-muted">{chain}</span>
      </div>
    </div>
  )
}

// Icons
function GridIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
}
function AgentsIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M2 14C2 11.24 4.69 9 8 9C11.31 9 14 11.24 14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
}
function LeaseIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 1L14 4V8C14 11.31 11.31 14 8 14C4.69 14 2 11.31 2 8V4L8 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
}
function SettingsIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M8 1V3M8 13V15M1 8H3M13 8H15M3.05 3.05L4.46 4.46M11.54 11.54L12.95 12.95M12.95 3.05L11.54 4.46M4.46 11.54L3.05 12.95" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
}
