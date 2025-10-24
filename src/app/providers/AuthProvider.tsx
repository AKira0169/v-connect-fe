'use client';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isLoggedIn } from '@/api/auth.api';

type AuthProviderProps = {
  children: ReactNode;
};

const publicRoutes = ['/login'];

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    data: isAuthenticated,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['isLoggedIn'],
    queryFn: isLoggedIn,
    retry: false, // Don't retry on error, handle redirection instead
    refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
    staleTime: 0, // Consider data immediately stale to ensure fresh checks
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnReconnect: true, // Always refetch when connection is re-established
  });

  useEffect(() => {
    if (isLoading) return; // Don't do anything while loading

    if (isError) {
      // If there's an error fetching auth status, redirect to login if not already on a public route
      if (!publicRoutes.includes(pathname || '')) {
        router.push('/login');
      }
    } else {
      // If auth status fetched successfully
      if (isAuthenticated) {
        // If authenticated AND on a public route (like /login), redirect to home
        router.push('/chat');
      } else {
        // If not authenticated AND not on a public route, redirect to login
        if (!publicRoutes.includes(pathname || '')) {
          router.push('/login');
        }
      }
    }
  }, [isAuthenticated, isLoading, isError, pathname, router]);

  if (isLoading) {
    return null;
  }

  // Children are rendered only if not loading AND (authenticated OR on a public route).
  // The useEffect handles redirection logic.
  if (
    !isLoading &&
    (isAuthenticated || publicRoutes.includes(pathname || ''))
  ) {
    return <>{children}</>;
  }

  // Otherwise, return null (or keep showing loading indicator if preferred)
  // while loading or waiting for redirection/auth state to settle.
  return null;
}
