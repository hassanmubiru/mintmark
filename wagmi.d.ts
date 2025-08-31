declare module 'wagmi' {
  import { Address } from 'viem';

  export function createConfig(config: {
    connectors?: (() => any[]) | any[];
    publicClient: (args: { chainId?: number }) => any;
    webSocketPublicClient?: (args: { chainId?: number }) => any;
  }): any;

  export function configureChains(
    chains: any[],
    providers: any[]
  ): {
    chains: any[];
    publicClient: (args: { chainId?: number }) => any;
    webSocketPublicClient?: (args: { chainId?: number }) => any;
  };

  export function usePublicClient(): any;

  export function useWalletClient(): { data: any };

  export function useAccount(): {
    address?: Address;
    isConnected: boolean;
    isConnecting: boolean;
    isReconnecting: boolean;
    connector?: any;
  };

  export function readContracts(params: {
    contracts: Array<{
      address?: Address;
      abi: any[];
      functionName: string;
      args?: any[];
    }>;
    query?: {
      enabled?: boolean;
    };
  }): { data: any; isLoading: boolean; isError: boolean; error: Error | null };

  export function useContractWrite(params: {
    address?: Address;
    abi: any[];
    functionName: string;
  }): {
    data: any;
    write: (params: { args: any[] }) => Promise<any>;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    error: Error | null;
  };

  export function useWaitForTransaction(params: {
    hash: string;
  }): {
    data: any;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    error: Error | null;
  };

  export function useConnect(params?: {
    onError?: (error: Error) => void;
    onSuccess?: () => void;
  }): {
    connect: (params: { connector: any }) => void;
    connectors: any[];
    pendingConnector?: any;
  };

  export function useDisconnect(params?: {
    onSuccess?: () => void;
  }): {
    disconnect: () => void;
  };

  export function useNetwork(): {
    chain?: {
      id: number;
    };
  };

  export function useSwitchNetwork(params?: {
    onError?: (error: Error) => void;
    onSuccess?: () => void;
  }): {
    switchNetwork: (chainId: number) => void;
  };

  export function WagmiConfig(props: {
    config: any;
    children: React.ReactNode;
  }): JSX.Element;
}

declare module 'wagmi/chains' {
  export const base: any;
  export const baseGoerli: any;
  export const baseSepolia: any;
}

declare module 'wagmi/providers/alchemy' {
  export function alchemyProvider(params: { apiKey: string }): any;
}

declare module 'wagmi/providers/public' {
  export function publicProvider(): any;
}
