/// <reference types="vite/client" />
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

export interface Agent {
  agentId: number
  name: string
  description: string
  wallet: string
  owner: string
  capabilities: string[]
  services: { name: string; endpoint: string }[]
  x402Support: boolean
  supportedTrust: string[]
  successRate: number
  totalRevenue: number
  taskCount: number
  reputationScore: number
  reputation: {
    successRate: number
    totalRevenue: number
    taskCount: number
    avgLatency: number
    teeVerifiedCount: number
    caveatComplianceCount: number
  }
}

export interface AuthorizeRequest {
  permissionsContext: string
  delegationManager: string
  budget: string
  actions: string[]
  durationHours: number
  agentRequirements?: Record<string, {
    minReputation?: number
    minRevenue?: number
    maxBudget?: number
  }>
  veniceQualityOracle?: boolean
  chatId?: string
  chatName?: string
}

export interface AuthorizeResponse {
  leaseId: string
  sessionId?: string
  sessionActive: boolean
  budgetUsdc: number
  remainingUsdc: number
  expiresAt: number
  permissionsContext: string
  delegationManager: string
  chatId?: string
  agentRequirements?: Record<string, { minReputation?: number; minRevenue?: number; maxBudget?: number }>
  veniceQualityOracle?: boolean
}

export interface SessionResponse {
  active: boolean
  sessionId: string
  budgetUsdc: number
  spentUsdc: number
  remainingUsdc: number
  expiresAt: number
  allowedActions: string[]
  expiresIn: number
  agentRequirements: Record<string, { minReputation?: number; minRevenue?: number; maxBudget?: number }>
  veniceQualityOracle: boolean
}

export interface TaskResponse {
  taskId: string
  status: string
  message: string
  eventsUrl: string
  delegationsUrl: string
}

export interface SSEEvent {
  type: string
  taskId: string
  agentName?: string
  stepId?: string
  status?: string
  txHash?: string
  blockNumber?: number
  budgetAllocated?: number
  output?: string
  errorMessage?: string
  leaseId?: string
  result?: {
    content: string
    audioUrl?: string
    summary?: string
    totalSpentUsdc?: string
    txDetails?: Array<{
      agentName: string
      oneShotTaskId: string
      feeUsdc: number
    }>
  }
  error?: string
}

function getHeaders(userAddress: string, apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-User-Address': userAddress,
    'X-API-Key': apiKey,
  }
}

export async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch(`${BASE}/api/agents`)
  if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`)
  const data = await res.json() as { agents: Agent[] }
  return data.agents
}

export async function fetchAgent(agentId: number): Promise<Agent> {
  const res = await fetch(`${BASE}/api/agents/${agentId}`)
  if (!res.ok) throw new Error(`Failed to fetch agent ${agentId}`)
  return res.json() as Promise<Agent>
}

export async function authorize(
  req: AuthorizeRequest,
  userAddress: string,
  apiKey: string
): Promise<AuthorizeResponse> {
  const res = await fetch(`${BASE}/api/authorize`, {
    method: 'POST',
    headers: getHeaders(userAddress, apiKey),
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const err = await res.json() as { error?: string; detail?: string }
    throw new Error(err.detail ?? err.error ?? 'Authorization failed')
  }
  return res.json() as Promise<AuthorizeResponse>
}

export async function getSession(
  userAddress: string,
  apiKey: string
): Promise<SessionResponse | null> {
  const res = await fetch(`${BASE}/api/authorize/session`, {
    headers: getHeaders(userAddress, apiKey),
  })
  if (res.status === 404) return null
  if (!res.ok) return null
  const data = await res.json() as SessionResponse & { active?: boolean }
  if (!data.active) return null
  return data
}

export async function revokeSession(
  userAddress: string,
  apiKey: string
): Promise<void> {
  await fetch(`${BASE}/api/authorize/session`, {
    method: 'DELETE',
    headers: getHeaders(userAddress, apiKey),
  })
}

export async function submitTask(
  prompt: string,
  permissionsContext: string,
  delegationManager: string,
  userAddress: string,
  apiKey: string,
  options?: {
    chatId?: string
    preferredAgentIds?: number[]
    agentPreference?: 'user' | 'system' | 'mix'
  }
): Promise<TaskResponse> {
  const res = await fetch(`${BASE}/api/task`, {
    method: 'POST',
    headers: getHeaders(userAddress, apiKey),
    body: JSON.stringify({
      userMessage: prompt,
      permissionsContext,
      delegationManager,
      chatId: options?.chatId,
      preferredAgentIds: options?.preferredAgentIds,
      agentPreference: options?.agentPreference,
    }),
  })
  if (!res.ok) {
    const err = await res.json() as { error?: string; detail?: string }
    throw new Error(err.detail ?? err.error ?? 'Task submission failed')
  }
  return res.json() as Promise<TaskResponse>
}

export async function getDelegations(
  taskId: string,
  userAddress: string,
  apiKey: string
): Promise<unknown> {
  const res = await fetch(`${BASE}/api/delegations/${taskId}`, {
    headers: getHeaders(userAddress, apiKey),
  })
  if (!res.ok) return null
  return res.json()
}

// SSE subscription — returns cleanup function
export async function fetchChats(userAddress: string, apiKey: string): Promise<{
  threads: Array<{
    chatId: string
    name: string
    status: string
    messageCount: number
    lastMessageAt?: number
    createdAt: number
    session?: {
      budgetUsdc: number
      spentUsdc: number
      remainingUsdc: number
      expiresAt: number
      isExpired: boolean
      permissionsContext?: string
      delegationManager?: string
      sessionId?: string
      allowedActions?: string[]
      agentRequirements?: Record<string, { minReputation: number; minRevenue: number; maxBudget: number }>
      veniceQualityOracle?: boolean
    }
  }>
}> {
  const res = await fetch(`${BASE}/api/authorize/chats`, {
    headers: getHeaders(userAddress, apiKey),
  })
  if (!res.ok) throw new Error('Failed to fetch chats')
  return res.json()
}

export async function fetchMessages(userAddress: string, apiKey: string, sessionId: string): Promise<{
  messages: Array<{
    id: string
    type: 'user' | 'agent' | 'autonomous' | 'system'
    content: string
    taskId?: string
    audioUrl?: string
    metadata?: string
    createdAt: number
  }>
}> {
  const res = await fetch(`${BASE}/api/authorize/chat/messages?sessionId=${sessionId}`, {
    headers: getHeaders(userAddress, apiKey),
  })
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

export function subscribeToTask(
  taskId: string,
  userAddress: string,
  apiKey: string,
  onEvent: (event: SSEEvent) => void,
  onError?: (err: Error) => void
): () => void {
  const url = `${BASE}/api/events/${taskId}`

  // SSE doesn't support custom headers — pass via query param for auth
  const es = new EventSource(`${url}?userAddress=${userAddress}&apiKey=${apiKey}`)

  es.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data) as SSEEvent
      onEvent(event)
    } catch {
      // ignore malformed events
    }
  }

  es.onerror = () => {
    // Don't close on error — server closes connection after completed task replay
    // The EventSource will auto-reconnect unless we explicitly close it
  }
  es.addEventListener('error', () => {
    // Server ended connection (task complete) — this is expected
  })

  return () => es.close()
}

// Agent chat (direct, no delegation)
export async function agentChat(
  message: string,
  model: string,
  userAddress: string,
  apiKey: string
): Promise<{ content: string; model: string; usage: { totalTokens: number } }> {
  const res = await fetch(`${BASE}/api/agents/chat`, {
    method: 'POST',
    headers: getHeaders(userAddress, apiKey),
    body: JSON.stringify({ message, agentModel: model }),
  })
  if (!res.ok) {
    const err = await res.json() as { error?: string }
    throw new Error(err.error ?? 'Chat failed')
  }
  return res.json()
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`)
    return res.ok
  } catch {
    return false
  }
}
