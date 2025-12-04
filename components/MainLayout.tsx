// Main layout component with sidebar and content area
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from "next-auth/react"

import { apiFetch } from '@/lib/api';

import Sidebar from '@/components/Sidebar';
import { ScrollArea } from "@/components/ui/scroll-area";

import type { User } from "@/types";


interface MainLayoutProps {
  user: User | null;
  onLogout?: () => void;
  children?: React.ReactNode;
}

export default function MainLayout({ user, onLogout, children }: MainLayoutProps) {
  // const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  // If there's no user, redirect to login
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user, router]);

  useEffect(() => {
    router.prefetch('/auth/login');
  }, [router]);

  const handleLogOut =
    onLogout ??
    (async () => {
      // 1) Immediate local logout experience
      setIsLoggedOut(true);

      // 2) Call backend logout to revoke refresh token
      try {
        await apiFetch('/auth/logout', { method: 'POST' });
      } catch (e) {
        console.error('Backend logout failed', e);
      }

      // 3) Try client navigation
      try {
        router.replace('/auth/login');
      } catch { }

      // 4) Clear NextAuth session (no redirect, we handle it)
      void signOut({ redirect: false }).catch(() => { });

      // 5) Hard navigation to really reset client state
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.replace('/auth/login');
        }
      }, 300);
    });

  // Minimal fallback UI while redirecting
  if (!user || isLoggedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          {/* <p className="text-sm text-gray-500">Redirecting to login…</p> */}
          <p className="text-sm text-gray-500">You have been logged out.</p>
          <button
            onClick={() => {
              window.location.href = '/auth/login';
              // router.push('/auth/login');
            }}
            className="mt-3 inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-500"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Authenticated layout
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogOut} />

      {/* Main content area */}
      <div className="flex-1 transition-all duration-300"> {/* lg:ml-64 removed*/}
        <ScrollArea className='h-screen'>
          <main className="p-6">
            {children}
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}
