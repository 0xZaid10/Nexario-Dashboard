import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Import providers store FIRST — populates EIP-6963 store before wagmi config loads
import './lib/providers';
import { wagmiConfig } from './config/wagmi';
import App from './App';
import './index.css';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, staleTime: 30000 },
    },
});
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(WagmiProvider, { config: wagmiConfig, children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(App, {}) }) }) }) }));
