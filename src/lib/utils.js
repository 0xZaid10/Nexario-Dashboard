export function randomUUID() {
    return crypto.randomUUID();
}
export function formatTime(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000)
        return 'just now';
    if (diff < 3600000)
        return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000)
        return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
}
export function truncateAddress(addr) {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
