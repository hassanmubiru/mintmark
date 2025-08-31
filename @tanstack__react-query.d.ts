declare module '@tanstack/react-query' {
  export class QueryClient {
    constructor(options?: {
      defaultOptions?: {
        queries?: {
          refetchOnWindowFocus?: boolean;
          retry?: number;
          staleTime?: number;
        }
      }
    });
  }

  export function QueryClientProvider(props: { 
    client: QueryClient; 
    children: React.ReactNode 
  }): JSX.Element;
}
