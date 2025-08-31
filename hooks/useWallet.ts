import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { useCallback, useEffect, useState } from 'react';
import { NETWORKS, STORAGE_KEYS } from '@/utils/constants';

export interface WalletState {
  address?: string;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  chainId?: number;
  connector?: any;
}

export interface WalletActions {
  connect: () => void;
  disconnect: () => void;
  switchToSupportedNetwork: () => void;
}

export interface UseWalletReturn extends WalletState, WalletActions {
  isOnSupportedNetwork: boolean;
  supportedNetworks: typeof NETWORKS;
  error?: string;
}

/**
 * Custom hook for managing wallet connection state and actions
 * Provides a simplified interface for wallet operations
 */
export function useWallet(): UseWalletReturn {
  const [error, setError] = useState<string>();
  
  const {
    address,
    isConnected,
    isConnecting,
    isReconnecting,
    connector,
  } = useAccount();
  
  const { chain } = useNetwork();
  const { connect, connectors, pendingConnector } = useConnect({
    onError: (error) => {
      console.error('Wallet connection error:', error);
      setError(error.message);
    },
    onSuccess: () => {
      setError(undefined);
      // Store connection preference
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.WALLET_CONNECTION, 'true');
      }
    },
  });
  
  const { disconnect } = useDisconnect({
    onSuccess: () => {
      setError(undefined);
      // Clear connection preference
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.WALLET_CONNECTION);
      }
    },
  });
  
  const { switchNetwork } = useSwitchNetwork({
    onError: (error) => {
      console.error('Network switch error:', error);
      setError(error.message);
    },
    onSuccess: () => {
      setError(undefined);
    },
  });

  // Check if current network is supported
  const isOnSupportedNetwork = useCallback(() => {
    if (!chain?.id) return false;
    const supportedChainIds = Object.values(NETWORKS).map(network => network.chainId);
    return supportedChainIds.some(supportedId => supportedId === chain.id);
  }, [chain?.id]);

  // Get the preferred/default connector (MetaMask if available, otherwise first available)
  const getPreferredConnector = useCallback(() => {
    const metaMaskConnector = connectors.find(
      connector => connector.id === 'metaMask' || connector.name === 'MetaMask'
    );
    return metaMaskConnector || connectors[0];
  }, [connectors]);

  // Connect to wallet
  const connectWallet = useCallback(() => {
    const preferredConnector = getPreferredConnector();
    if (preferredConnector) {
      connect({ connector: preferredConnector });
    } else {
      setError('No wallet connectors available');
    }
  }, [connect, getPreferredConnector]);

  // Switch to a supported network
  const switchToSupportedNetwork = useCallback(() => {
    if (!switchNetwork) {
      setError('Network switching not supported');
      return;
    }

    // Try to switch to the default network (Base Mainnet or Goerli for development)
    const targetChainId = process.env.NODE_ENV === 'development' 
      ? NETWORKS.BASE_GOERLI.chainId 
      : NETWORKS.BASE_MAINNET.chainId;
    
    switchNetwork(targetChainId);
  }, [switchNetwork]);

  // Auto-reconnect on page load if user was previously connected
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasConnected = localStorage.getItem(STORAGE_KEYS.WALLET_CONNECTION);
      if (wasConnected && !isConnected && !isConnecting && !isReconnecting) {
        // Small delay to allow wagmi to attempt auto-reconnection
        const timer = setTimeout(() => {
          connectWallet();
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isConnected, isConnecting, isReconnecting, connectWallet]);

  // Clear errors when connection state changes
  useEffect(() => {
    if (isConnected) {
      setError(undefined);
    }
  }, [isConnected]);

  return {
    // State
    address,
    isConnected,
    isConnecting: isConnecting || pendingConnector != null,
    isReconnecting,
    chainId: chain?.id,
    connector,
    
    // Computed state
    isOnSupportedNetwork: isOnSupportedNetwork(),
    supportedNetworks: NETWORKS,
    error,
    
    // Actions
    connect: connectWallet,
    disconnect,
    switchToSupportedNetwork,
  };
}

/**
 * Hook for checking if user has connected wallet
 * Throws error if wallet is not connected (useful for protected routes)
 */
export function useRequireWallet(): WalletState & { address: string } {
  const wallet = useWallet();
  
  if (!wallet.isConnected || !wallet.address) {
    throw new Error('Wallet connection required');
  }
  
  return {
    ...wallet,
    address: wallet.address,
  };
}

/**
 * Hook for getting the current network information
 */
export function useNetworkInfo() {
  const { chain } = useNetwork();
  const wallet = useWallet();
  
  const currentNetwork = Object.values(NETWORKS).find(
    network => network.chainId === chain?.id
  );
  
  return {
    chain,
    currentNetwork,
    isSupported: wallet.isOnSupportedNetwork,
    switchToSupported: wallet.switchToSupportedNetwork,
  };
}

/**
 * Hook for wallet connection status with loading states
 */
export function useWalletConnection() {
  const wallet = useWallet();
  
  return {
    isIdle: !wallet.isConnecting && !wallet.isReconnecting && !wallet.isConnected,
    isLoading: wallet.isConnecting || wallet.isReconnecting,
    isConnected: wallet.isConnected,
    hasError: !!wallet.error,
    error: wallet.error,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
  };
}
