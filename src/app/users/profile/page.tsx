'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MyProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    const username =
      typeof window !== 'undefined' ? localStorage.getItem('username') : null;
    if (username) {
      router.replace(`/users/${encodeURIComponent(username)}`);
    } else {
      router.replace('/login');
    }
  }, [router]);
  return null;
}
