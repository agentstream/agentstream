'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000
    }
  }
});

const QueryContext = (props: PropsWithChildren) => {
  return <QueryClientProvider client={client}>{props.children}</QueryClientProvider>;
};

export default QueryContext;
