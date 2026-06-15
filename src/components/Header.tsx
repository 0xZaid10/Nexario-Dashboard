import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useConnectors } from 'wagmi'
import { useSessionStore } from '../store/session'
import AuthorizeModal from './AuthorizeModal'
import { isMetaMaskAvailable } from '../config/wagmi'

export default function Header() {
  const { address, isConnected } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const connectors = useConnectors()
  const { session } = useSessionStore()
  const [showAuthorize, setShowAuthorize] = useState(false)
  const [noMetaMask, setNoMetaMask] = useState(false)

  const budgetPct = session
    ? (session.remainingUsdc / session.budgetUsdc) * 100
    : 0

  function handleConnect() {
    if (!isMetaMaskAvailable()) {
      setNoMetaMask(true)
      return
    }
    const connector = connectors[0]
    if (connector) connect({ connector })
  }

  return (
    <>
      <header className="flex items-center justify-between px-6 py-3.5 shrink-0 bg-transparent">

        {/* Left — session budget */}
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted">Budget</span>
                  <span className="text-sm font-mono text-text">
                    ${session.remainingUsdc.toFixed(2)}
                    <span className="text-muted"> / ${session.budgetUsdc.toFixed(2)}</span>
                  </span>
                </div>
                <div className="w-36 h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => setShowAuthorize(true)}
                className="text-sm text-accent hover:text-accent/80 transition-colors"
              >
                Renew
              </button>
            </div>
          ) : null}
        </div>

        {/* Right — wallet */}
        <div className="flex items-center gap-2 ml-auto">
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="text-sm font-mono text-text">
                  {address.slice(0, 6)}…{address.slice(-4)}
                </span>
              </div>
              <button
                onClick={() => disconnect()}
                className="px-2.5 py-1.5 text-sm text-muted hover:text-danger transition-colors rounded-lg hover:bg-danger/10"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {isPending ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </header>

      {/* No MetaMask installed */}
      {noMetaMask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setNoMetaMask(false)} />
          <div className="relative w-full max-w-sm card animate-slide-up p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center mx-auto mb-3">
              <MetaMaskIcon size={24} />
            </div>
            <h3 className="font-display font-semibold text-text mb-2">MetaMask Required</h3>
            <p className="text-sm text-muted mb-4">
              Nexario uses MetaMask's ERC-7715 Advanced Permissions for authority leasing.
              Install MetaMask to continue.
            </p>
            <a
              href="https://metamask.io/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Install MetaMask →
            </a>
            <p className="text-xs text-muted mt-3">
              Already have MetaMask?{' '}
              <button
                onClick={() => { setNoMetaMask(false); window.location.reload() }}
                className="text-accent hover:underline"
              >
                Refresh the page
              </button>
            </p>
          </div>
        </div>
      )}

      {showAuthorize && (
        <AuthorizeModal onClose={() => setShowAuthorize(false)} />
      )}
    </>
  )
}

function MetaMaskIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 35 33" fill="none">
      <path d="M32.958 1L19.845 10.375l2.433-5.766L32.958 1z" fill="#E17726" stroke="#E17726" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.042 1l13.001 9.468-2.316-5.859L2.042 1z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28.225 23.533l-3.489 5.338 7.464 2.054 2.143-7.277-6.118-.115z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M.676 23.648l2.13 7.277 7.45-2.054-3.476-5.338-6.104.115z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.884 14.515l-2.08 3.143 7.405.337-.248-7.969-5.077 4.489z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M25.116 14.515l-5.155-4.582-.169 8.062 7.404-.337-2.08-3.143z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.256 28.871l4.487-2.168-3.864-3.015-.623 5.183z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.257 26.703l4.474 2.168-.61-5.183-3.864 3.015z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
