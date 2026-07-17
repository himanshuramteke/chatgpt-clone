"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryclient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, //30 seconds
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryclient}>{children}</QueryClientProvider>
  );
}
