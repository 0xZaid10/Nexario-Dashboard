import { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useSessionStore } from '../store/session'
import { revokeSession } from '../lib/api'

export default function SettingsView() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const {
    apiKey, setApiKey,
    defaultMinReputation, setDefaultMinReputation,
    veniceQualityOracle, setVeniceQualityOracle,
    session, setSession,
    taskHistory,
  } = useSessionStore()

  const [apiKeyInput, setApiKeyInput] = useState(apiKey)
  const [saved, setSaved] = useState(false)
  const [revoking, setRevoking] = useState(false)

  function saveApiKey() {
    setApiKey(apiKeyInput)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function handleRevokeSession() {
    if (!address || !session) return
    setRevoking(true)
    try {
      await revokeSession(address, apiKey)
      setSession(null)
    } catch {
      setSession(null)
    } finally {
      setRevoking(false)
    }
  }

  const CONTRACTS = [
    { label: 'AgentRegistry',          address: '0x80B5EE8dAE9D18a252072E1D35aEde9f8aF50054', chain: 'Sepolia' },
    { label: 'ReputationRegistry',     address: '0x718B31833264B2CfC5010bD5C15f43178DB91d7c', chain: 'Sepolia' },
    { label: 'AuthorityLeaseRegistry', address: '0x1eFC01F8fD8F24Baa113fff70fA1e5D96BB39044', chain: 'Sepolia' },
    { label: 'ReputationGatedCaveat',  address: '0x8300caFd1705c822a4c6719A60877A33F21c5A4F', chain: 'Sepolia' },
    { label: 'DelegationManager',      address: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3', chain: 'Mainnet' },
  ]

  return (
    <div className="h-full overflow-y-auto px-6 py-5 max-w-xl">
      <div className="mb-5">
        <h2 className="font-display font-semibold text-text text-base">Settings</h2>
        <p className="text-xs text-muted mt-0.5">Configuration and contract addresses</p>
      </div>

      <div className="space-y-5">
        {/* Wallet */}
        <Section title="Wallet">
          {isConnected && address ? (
            <div className="space-y-2">
              <Row label="Connected address">
                <span className="font-mono text-xs text-text">{address}</span>
              </Row>
              <Row label="Network">
                <span className="text-xs text-text">Ethereum Mainnet + Sepolia</span>
              </Row>
              <button
                onClick={() => disconnect()}
                className="text-xs text-danger hover:underline"
              >
                Disconnect wallet
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted">No wallet connected</p>
          )}
        </Section>

        {/* API Key */}
        <Section title="Backend API Key">
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="nexario-dev-key-…"
              className="flex-1 bg-bg border border-border rounded-md px-3 py-1.5 text-xs font-mono text-text focus:outline-none focus:border-accent/50"
            />
            <button
              onClick={saveApiKey}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                saved ? 'bg-success/20 text-success' : 'bg-surface border border-border text-muted hover:text-text'
              }`}
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </Section>

        {/* Defaults */}
        <Section title="Default Agent Requirements">
          <div className="space-y-3">
            <Row label="Min reputation threshold">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={defaultMinReputation}
                  onChange={(e) => setDefaultMinReputation(Number(e.target.value))}
                  className="w-24 accent-accent"
                />
                <span className="font-mono text-xs text-accent w-6">{defaultMinReputation}</span>
              </div>
            </Row>
            <Row label="Venice quality oracle">
              <button
                onClick={() => setVeniceQualityOracle(!veniceQualityOracle)}
                className={`w-9 h-5 rounded-full transition-colors ${
                  veniceQualityOracle ? 'bg-accent2' : 'bg-border'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white mx-auto transition-transform ${
                  veniceQualityOracle ? 'translate-x-2' : '-translate-x-2'
                }`} />
              </button>
            </Row>
            <p className="text-xs text-muted">
              These become the defaults in the authorize modal. Override per-agent in advanced settings.
            </p>
          </div>
        </Section>

        {/* Active session */}
        {session && (
          <Section title="Active Session">
            <div className="space-y-2">
              <Row label="Session ID">
                <span className="font-mono text-xs text-muted">{session.sessionId.slice(0, 16)}…</span>
              </Row>
              <Row label="Budget remaining">
                <span className="font-mono text-xs text-text">${session.remainingUsdc.toFixed(2)}</span>
              </Row>
              <Row label="Expires">
                <span className="text-xs text-text">{new Date(session.expiresAt * 1000).toLocaleString()}</span>
              </Row>
              <button
                onClick={handleRevokeSession}
                disabled={revoking}
                className="text-xs text-danger hover:underline disabled:opacity-50"
              >
                {revoking ? 'Revoking…' : 'Revoke session'}
              </button>
            </div>
          </Section>
        )}

        {/* Contracts */}
        <Section title="Contract Addresses">
          <div className="space-y-2">
            {CONTRACTS.map(({ label, address: addr, chain }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-text">{label}</div>
                  <div className="text-xs text-muted">{chain}</div>
                </div>
                <a
                  href={`https://${chain === 'Sepolia' ? 'sepolia.' : ''}etherscan.io/address/${addr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-muted hover:text-accent transition-colors"
                  title={addr}
                >
                  {addr.slice(0, 6)}…{addr.slice(-4)} ↗
                </a>
              </div>
            ))}
          </div>
        </Section>

        {/* Stats */}
        <Section title="Local Data">
          <div className="space-y-1 text-xs text-muted">
            <Row label="Tasks in history"><span>{taskHistory.length}</span></Row>
            <Row label="Storage">
              <button
                onClick={() => {
                  if (confirm('Clear all local task history?')) {
                    localStorage.removeItem('nexario-session')
                    window.location.reload()
                  }
                }}
                className="text-danger hover:underline"
              >
                Clear local data
              </button>
            </Row>
          </div>
        </Section>

        {/* Version */}
        <div className="text-xs text-muted pt-2 border-t border-border">
          Nexario v1.0.0 · MetaMask × 1Shot × Venice Hackathon
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="font-display font-semibold text-xs text-muted uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted shrink-0">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
