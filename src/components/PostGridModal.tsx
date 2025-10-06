'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUserPosts, fetchUserLikes } from '@/lib/api';

type Mode = 'posts' | 'likes';

type PostGridModalProps = {
  username: string;
  mode: Mode;
  onClose: () => void;
};

export default function PostGridModal({
  username,
  mode,
  onClose,
}: PostGridModalProps) {
  const title = mode === 'posts' ? 'Posts' : 'Liked Posts';
  const { data, isLoading, error } = useQuery({
    queryKey: ['postGrid', mode, username],
    queryFn: async () => {
      if (mode === 'posts') return fetchUserPosts(username, 1, 30);
      return fetchUserLikes(username, 1, 30);
    },
    staleTime: 30_000,
    enabled: !!username,
  });

  const posts = (data?.posts || []) as Array<{
    imageUrl?: string;
    mediaUrl?: string;
    photoUrl?: string;
    images?: string[];
  }>;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className='fixed inset-0 z-[500] flex items-center justify-center'>
      <div className='absolute inset-0 bg-black/60' onClick={() => onClose()} />
      <div className='relative w-[900px] max-w-[95vw] max-h-[85vh] rounded-[12px] bg-[#0a0d12] border border-[#181d27] overflow-hidden shadow-xl'>
        <div className='flex items-center justify-between px-[20px] py-[16px] border-b border-[#181d27]'>
          <span className="font-['SF_Pro'] text-[18px] font-bold text-[#fdfdfd]">
            {title}
          </span>
          <button
            type='button'
            aria-label='Close'
            className='w-[24px] h-[24px] text-[#fdfdfd] hover:opacity-80'
            onClick={() => onClose()}
          >
            ×
          </button>
        </div>
        <div className='p-[16px] overflow-y-auto' style={{ maxHeight: '70vh' }}>
          {isLoading ? (
            <div className='text-[#a4a7ae] font-sfpro text-sm px-[4px]'>
              Loading...
            </div>
          ) : error ? (
            <div className='text-red-400 font-sfpro text-sm px-[4px]'>
              {(error as Error).message}
            </div>
          ) : posts.length === 0 ? (
            <div className='text-[#a4a7ae] font-sfpro text-sm px-[4px]'>
              No items.
            </div>
          ) : (
            <div className='grid grid-cols-3 gap-[8px]'>
              {posts.map((p, idx) => {
                const url =
                  p.imageUrl ||
                  p.mediaUrl ||
                  p.photoUrl ||
                  (p.images && p.images[0]) ||
                  '';
                return (
                  <div
                    key={idx}
                    className='w-full pt-[100%] rounded-[8px] bg-cover bg-center bg-no-repeat'
                    style={{ backgroundImage: `url(${url})` }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
