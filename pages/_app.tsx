import React from 'react';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { base, baseGoerli, baseSepolia } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';

import { RainbowKitProvider, getDefaultWallets, connectorsForWallets } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useToast, setGlobalToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ToastContainer';
import { APP_CONFIG } from '@/utils/constants';

// Configure chains and providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    baseGoerli, // Primary testnet
    baseSepolia, // Alternative testnet
    base, // Mainnet
    ...(process.env.NODE_ENV === 'development' ? [] : []), // Add localhost in development if needed
  ],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY! }),
    publicProvider(),
  ]
);

// Get default wallets
const { wallets } = getDefaultWallets({
  appName: APP_CONFIG.NAME,
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains,
});

// Configure connectors
const connectors = connectorsForWallets([
  ...wallets,
  {
    groupName: 'Other',
    wallets: [
      {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        iconUrl: 'https://avatars.githubusercontent.com/u/18060234?s=280&v=4',
        iconBackground: '#0052ff',
        createConnector: () => ({
          connector: new CoinbaseWalletConnector({
            chains,
            options: {
              appName: APP_CONFIG.NAME,
            },
          }),
        }),
      },
    ],
  },
]);

// Create wagmi config
const wagmiConfig = createConfig({
  connectors,
  publicClient,
  webSocketPublicClient,
});

// Create query client for react-query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 30000, // 30 seconds
    },
  },
});

// Toast provider component
function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  
  // Set global toast instance
  React.useEffect(() => {
    setGlobalToast(toast);
  }, [toast]);

  return (
    <>
      {children}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider
          chains={chains}
          appInfo={{
            appName: APP_CONFIG.NAME,
            learnMoreUrl: APP_CONFIG.DOCUMENTATION_URL,
          }}
          theme={{
            blurs: {
              modalOverlay: 'blur(4px)',
            },
            colors: {
              accentColor: '#3b82f6',
              accentColorForeground: '#ffffff',
              actionButtonBorder: 'rgba(255, 255, 255, 0.04)',
              actionButtonBorderMobile: 'rgba(255, 255, 255, 0.08)',
              actionButtonSecondaryBackground: 'rgba(255, 255, 255, 0.08)',
              closeButton: 'rgba(224, 232, 255, 0.6)',
              closeButtonBackground: 'rgba(255, 255, 255, 0.08)',
              connectButtonBackground: '#ffffff',
              connectButtonBackgroundError: '#ff494a',
              connectButtonInnerBackground: 'linear-gradient(0deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.15))',
              connectButtonText: '#25292e',
              connectButtonTextError: '#ffffff',
              connectionIndicator: '#30e000',
              downloadBottomCardBackground: 'linear-gradient(126deg, rgba(255, 255, 255, 0) 9.49%, rgba(171, 171, 171, 0.04) 71.04%), #1a1b1f',
              downloadTopCardBackground: 'linear-gradient(126deg, rgba(171, 171, 171, 0.2) 9.49%, rgba(255, 255, 255, 0) 71.04%), #1a1b1f',
              error: '#ff494a',
              generalBorder: 'rgba(255, 255, 255, 0.08)',
              generalBorderDim: 'rgba(255, 255, 255, 0.04)',
              menuItemBackground: 'rgba(224, 232, 255, 0.1)',
              modalBackdrop: 'rgba(0, 0, 0, 0.3)',
              modalBackground: '#ffffff',
              modalBorder: 'rgba(255, 255, 255, 0.08)',
              modalText: '#25292e',
              modalTextDim: 'rgba(37, 41, 46, 0.6)',
              modalTextSecondary: 'rgba(37, 41, 46, 0.8)',
              profileAction: '#ffffff',
              profileActionHover: 'rgba(255, 255, 255, 0.8)',
              profileForeground: '#ffffff',
              selectedOptionBorder: 'rgba(224, 232, 255, 0.1)',
              standby: '#ffd641',
            },
            fonts: {
              body: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            },
            radii: {
              actionButton: '12px',
              connectButton: '12px',
              menuButton: '12px',
              modal: '16px',
              modalMobile: '16px',
            },
            shadows: {
              connectButton: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              dialog: '0px 8px 32px rgba(0, 0, 0, 0.32)',
              profileDetailsAction: '0px 2px 6px rgba(37, 41, 46, 0.04)',
              selectedOption: '0px 2px 6px rgba(0, 0, 0, 0.24)',
              selectedWallet: '0px 2px 6px rgba(0, 0, 0, 0.12)',
              walletLogo: '0px 2px 16px rgba(0, 0, 0, 0.16)',
            },
          }}
        >
          <ToastProvider>
            <div className="min-h-screen bg-gray-50">
              {/* Navigation would go here */}
              <Component {...pageProps} />
            </div>
          </ToastProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}
