import { createConfig, http, createConnector } from 'wagmi';
import { mainnet, sepolia, base } from 'wagmi/chains';
// Import store — populates on module load via EIP-6963
import { getMetaMaskProvider } from '../lib/providers';
function metaMaskFlaskConnector() {
    return createConnector((config) => ({
        id: 'metaMaskFlask',
        name: 'MetaMask',
        type: 'injected',
        async connect() {
            const mm = await getMetaMaskProvider();
            if (!mm)
                throw new Error('MetaMask not found. Please install MetaMask.');
            const accounts = await mm.provider.request({
                method: 'eth_requestAccounts',
            });
            const chainId = await mm.provider.request({ method: 'eth_chainId' });
            return { accounts, chainId: Number(chainId) };
        },
        async disconnect() { },
        async getAccounts() {
            const mm = await getMetaMaskProvider();
            if (!mm)
                return [];
            return mm.provider.request({ method: 'eth_accounts' });
        },
        async getChainId() {
            const mm = await getMetaMaskProvider();
            if (!mm)
                return mainnet.id;
            const chainId = await mm.provider.request({ method: 'eth_chainId' });
            return Number(chainId);
        },
        async getProvider() {
            const mm = await getMetaMaskProvider();
            return mm?.provider ?? null;
        },
        async isAuthorized() {
            try {
                const accounts = await this.getAccounts();
                return accounts.length > 0;
            }
            catch {
                return false;
            }
        },
        onAccountsChanged(accounts) {
            if (accounts.length === 0)
                config.emitter.emit('disconnect');
            else
                config.emitter.emit('change', { accounts: accounts });
        },
        onChainChanged(chainId) {
            config.emitter.emit('change', { chainId: Number(chainId) });
        },
        onDisconnect() { config.emitter.emit('disconnect'); },
        async setup() {
            const mm = await getMetaMaskProvider();
            if (!mm)
                return;
            mm.provider.on?.('accountsChanged', this.onAccountsChanged.bind(this));
            mm.provider.on?.('chainChanged', this.onChainChanged.bind(this));
            mm.provider.on?.('disconnect', this.onDisconnect.bind(this));
        },
    }));
}
export const wagmiConfig = createConfig({
    chains: [mainnet, sepolia, base],
    connectors: [metaMaskFlaskConnector()],
    transports: {
        [mainnet.id]: http('https://ethereum-rpc.publicnode.com'),
        [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
        [base.id]: http('https://mainnet.base.org'),
    },
    multiInjectedProviderDiscovery: false,
});
export const REGISTRY_CHAIN_ID = sepolia.id; // Our contracts (read-only for users)
export const EXECUTION_CHAIN_ID = mainnet.id; // 1Shot relay execution
export const FEE_CHAIN_ID = base.id; // User funds here — Base USDC
export const DELEGATION_MANAGER = '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3';
export function isMetaMaskAvailable() {
    const win = window;
    if (win.ethereum?.isMetaMask)
        return true;
    if (win.ethereum?.providers?.some((p) => p.isMetaMask))
        return true;
    return false;
}
