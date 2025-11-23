"use client"

import { SessionProvider } from "next-auth/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/queryClient"
// import { useEffect } from "react"
// import { setSessionUpdater } from '@/lib/session-updater';

/**
function SessionUpdaterRegistrar() {
    const { update } = useSession();
    useEffect(() => {
        // NextAuth v4: update(payload) -> triggers callbacks.jwt with trigger === 'update'
        setSessionUpdater((data) => update(data));
    }, [update]);
    return null;
} */

export default function Providers({ children }: { children: React.ReactNode }) {
    // const [qc] = useState(() => new QueryClient());
    return (
        <SessionProvider refetchInterval={4 * 60} refetchOnWindowFocus={true}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </SessionProvider>
    )
}
