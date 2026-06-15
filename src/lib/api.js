/// <reference types="vite/client" />
const BASE = import.meta.env.VITE_API_URL ?? '';
function getHeaders(userAddress, apiKey) {
    return {
        'Content-Type': 'application/json',
        'X-User-Address': userAddress,
        'X-API-Key': apiKey,
    };
}
export async function fetchAgents() {
    const res = await fetch(`${BASE}/api/agents`);
    if (!res.ok)
        throw new Error(`Failed to fetch agents: ${res.status}`);
    const data = await res.json();
    return data.agents;
}
export async function fetchAgent(agentId) {
    const res = await fetch(`${BASE}/api/agents/${agentId}`);
    if (!res.ok)
        throw new Error(`Failed to fetch agent ${agentId}`);
    return res.json();
}
export async function authorize(req, userAddress, apiKey) {
    const res = await fetch(`${BASE}/api/authorize`, {
        method: 'POST',
        headers: getHeaders(userAddress, apiKey),
        body: JSON.stringify(req),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? err.error ?? 'Authorization failed');
    }
    return res.json();
}
export async function getSession(userAddress, apiKey) {
    const res = await fetch(`${BASE}/api/authorize/session`, {
        headers: getHeaders(userAddress, apiKey),
    });
    if (res.status === 404)
        return null;
    if (!res.ok)
        return null;
    const data = await res.json();
    if (!data.active)
        return null;
    return data;
}
export async function revokeSession(userAddress, apiKey) {
    await fetch(`${BASE}/api/authorize/session`, {
        method: 'DELETE',
        headers: getHeaders(userAddress, apiKey),
    });
}
export async function submitTask(prompt, permissionsContext, delegationManager, userAddress, apiKey, options) {
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
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? err.error ?? 'Task submission failed');
    }
    return res.json();
}
export async function getDelegations(taskId, userAddress, apiKey) {
    const res = await fetch(`${BASE}/api/delegations/${taskId}`, {
        headers: getHeaders(userAddress, apiKey),
    });
    if (!res.ok)
        return null;
    return res.json();
}
// SSE subscription — returns cleanup function
export async function fetchChats(userAddress, apiKey) {
    const res = await fetch(`${BASE}/api/authorize/chats`, {
        headers: getHeaders(userAddress, apiKey),
    });
    if (!res.ok)
        throw new Error('Failed to fetch chats');
    return res.json();
}
export async function fetchMessages(userAddress, apiKey, sessionId) {
    const res = await fetch(`${BASE}/api/authorize/chat/messages?sessionId=${sessionId}`, {
        headers: getHeaders(userAddress, apiKey),
    });
    if (!res.ok)
        throw new Error('Failed to fetch messages');
    return res.json();
}
export function subscribeToTask(taskId, userAddress, apiKey, onEvent, onError) {
    const url = `${BASE}/api/events/${taskId}`;
    // SSE doesn't support custom headers — pass via query param for auth
    const es = new EventSource(`${url}?userAddress=${userAddress}&apiKey=${apiKey}`);
    es.onmessage = (e) => {
        try {
            const event = JSON.parse(e.data);
            onEvent(event);
        }
        catch {
            // ignore malformed events
        }
    };
    es.onerror = () => {
        // Don't close on error — server closes connection after completed task replay
        // The EventSource will auto-reconnect unless we explicitly close it
    };
    es.addEventListener('error', () => {
        // Server ended connection (task complete) — this is expected
    });
    return () => es.close();
}
// Agent chat (direct, no delegation)
export async function agentChat(message, model, userAddress, apiKey) {
    const res = await fetch(`${BASE}/api/agents/chat`, {
        method: 'POST',
        headers: getHeaders(userAddress, apiKey),
        body: JSON.stringify({ message, agentModel: model }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Chat failed');
    }
    return res.json();
}
// Health check
export async function healthCheck() {
    try {
        const res = await fetch(`${BASE}/health`);
        return res.ok;
    }
    catch {
        return false;
    }
}
