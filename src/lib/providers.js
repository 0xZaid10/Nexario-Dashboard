/**
 * EIP-6963 provider store — collects ALL providers at page load
 * so they're available synchronously when needed.
 *
 * Flask RDNS: io.metamask.flask
 * Standard MetaMask RDNS: io.metamask
 */
// Store populated at module load time
const store = [];
let initialized = false;
function init() {
    if (initialized || typeof window === 'undefined')
        return;
    initialized = true;
    window.addEventListener('eip6963:announceProvider', (event) => {
        const detail = event.detail;
        // Deduplicate by rdns
        if (!store.some((p) => p.info.rdns === detail.info.rdns)) {
            store.push(detail);
        }
    });
    // Trigger all wallets to announce
    window.dispatchEvent(new Event('eip6963:requestProvider'));
}
// Initialize immediately on import
init();
// Wait for providers to announce (they fire synchronously on dispatchEvent
// but some wallets are async — wait up to 200ms)
export function waitForProviders(ms = 200) {
    return new Promise((resolve) => {
        setTimeout(() => resolve([...store]), ms);
    });
}
// Get Flask provider — preferred for ERC-7715
export async function getFlaskProvider() {
    await waitForProviders();
    const flask = store.find((p) => p.info.rdns === 'io.metamask.flask');
    return flask?.provider ?? null;
}
// Get best MetaMask provider — Flask > standard MetaMask
export async function getMetaMaskProvider() {
    await waitForProviders();
    const flask = store.find((p) => p.info.rdns === 'io.metamask.flask');
    if (flask)
        return { provider: flask.provider, isFlask: true, name: 'MetaMask Flask' };
    const standard = store.find((p) => p.info.rdns === 'io.metamask');
    if (standard)
        return { provider: standard.provider, isFlask: false, name: 'MetaMask' };
    // Legacy fallback
    const win = window;
    const legacy = win.ethereum?.providers?.find((p) => p.isMetaMask && !p.isBraveWallet && !p.isCoinbaseWallet) ?? (win.ethereum?.isMetaMask ? win.ethereum : null);
    if (legacy)
        return { provider: legacy, isFlask: !!legacy.isMetaMaskFlask, name: 'MetaMask' };
    return null;
}
export function getProviderByRdns(rdns) {
    return store.find((p) => p.info.rdns === rdns)?.provider ?? null;
}
export function isFlaskAvailable() {
    return store.some((p) => p.info.rdns === 'io.metamask.flask');
}
