import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API Request: ${method} ${url}`);
  if (data) {
    console.log('Request data:', JSON.stringify(data));
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    console.log(`Response status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      console.error(`Error response: ${res.status} ${res.statusText}`);
      // Don't throw here, return the error response for detailed handling
      return res;
    }
    
    return res;
  } catch (error) {
    console.error('Network error in API request:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Handle array query keys (e.g., ['/api/users', userId])
    let url = queryKey[0] as string;
    if (queryKey.length > 1 && typeof queryKey[0] === 'string' && queryKey[1] !== undefined) {
      // If the URL is something like '/api/users' and there's a second parameter, append it
      url = `${url}/${queryKey[1]}`;
    }
    
    console.log('Fetching URL:', url);
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
