'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUserLikes } from '@/lib/api';

export default function UserLikes() {
  const [posts, setPosts] = useState<unknown[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const username = mounted ? localStorage.getItem('username') : null;
  const { data, isLoading, error } = useQuery({
    queryKey: ['likes', username],
    queryFn: () => fetchUserLikes(username || '', 1, 20),
    enabled: !!username && mounted,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (data?.posts) setPosts(data.posts);
  }, [data]);

  // Avoid hydration mismatch on first SSR render
  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className='text-[#a4a7ae] font-sfpro text-sm px-[16px] lg:px-0'>
        Loading likes...
      </div>
    );
  }
  if (error) {
    return (
      <div className='text-red-400 font-sfpro text-sm px-[16px] lg:px-0'>
        {(error as Error).message}
      </div>
    );
  }

  return (
    <div className='flex w-full max-w-[600px] flex-col gap-[12px] items-start relative mx-auto px-[16px] lg:px-0'>
      <span className="font-['SF_Pro'] text-[16px] font-bold text-[#fdfdfd]">
        Liked Posts
      </span>
      {posts.length === 0 ? (
        <div className='text-[#a4a7ae] font-sfpro text-sm'>No likes yet.</div>
      ) : (
        <ul className='list-disc list-inside text-[#fdfdfd] font-sfpro text-sm'>
          {posts.map((_, idx) => (
            <li key={idx}>Post #{idx + 1}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
