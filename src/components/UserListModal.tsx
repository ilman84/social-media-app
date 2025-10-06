'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchUserFollowers,
  fetchUserFollowing,
  followUser,
  unfollowUser,
} from '@/lib/api';

type Mode = 'followers' | 'following';

type UserListModalProps = {
  username: string;
  mode: Mode;
  token?: string | null;
  onClose: () => void;
};

type RowUser = {
  id: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  isFollowedByMe?: boolean;
  isMe?: boolean;
};

export default function UserListModal({
  username,
  mode,
  token,
  onClose,
}: UserListModalProps) {
  const queryClient = useQueryClient();
  const title = mode === 'followers' ? 'Followers' : 'Following';
  const { data, isLoading, error } = useQuery({
    queryKey: ['userList', mode, username],
    queryFn: async () => {
      if (mode === 'followers')
        return fetchUserFollowers(username, 1, 50, token);
      return fetchUserFollowing(username, 1, 50, token);
    },
    staleTime: 30_000,
    enabled: !!username,
  });

  const users: RowUser[] = ((data as unknown as { users?: RowUser[] })?.users ||
    []) as RowUser[];

  const followMutation = useMutation({
    mutationFn: async (uname: string) => {
      if (!token) throw new Error('Please login');
      return followUser(uname, token);
    },
    onMutate: async (uname: string) => {
      await queryClient.cancelQueries({
        queryKey: ['userList', mode, username],
      });
      const previous = queryClient.getQueryData(['userList', mode, username]);
      queryClient.setQueryData(
        ['userList', mode, username],
        (old: { users?: RowUser[] } | undefined) => {
          if (!old?.users) return old;
          return {
            ...old,
            users: old.users.map((u) =>
              u.username === uname ? { ...u, isFollowedByMe: true } : u
            ),
          };
        }
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(['userList', mode, username], ctx.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userList', mode, username] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (uname: string) => {
      if (!token) throw new Error('Please login');
      return unfollowUser(uname, token);
    },
    onMutate: async (uname: string) => {
      await queryClient.cancelQueries({
        queryKey: ['userList', mode, username],
      });
      const previous = queryClient.getQueryData(['userList', mode, username]);
      queryClient.setQueryData(
        ['userList', mode, username],
        (old: { users?: RowUser[] } | undefined) => {
          if (!old?.users) return old;
          return {
            ...old,
            users: old.users.map((u) =>
              u.username === uname ? { ...u, isFollowedByMe: false } : u
            ),
          };
        }
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(['userList', mode, username], ctx.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userList', mode, username] });
    },
  });

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
      <div className='relative w-[560px] max-w-[90vw] max-h-[85vh] rounded-[12px] bg-[#0a0d12] border border-[#181d27] overflow-hidden shadow-xl'>
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
          ) : users.length === 0 ? (
            <div className='text-[#a4a7ae] font-sfpro text-sm px-[4px]'>
              No users.
            </div>
          ) : (
            <ul className='flex flex-col gap-[16px]'>
              {users.map((u) => {
                const following = !!u.isFollowedByMe;
                const disabled =
                  followMutation.isPending || unfollowMutation.isPending;
                return (
                  <li key={u.id} className='flex items-center justify-between'>
                    <div className='flex items-center gap-[12px]'>
                      <div
                        className='w-[40px] h-[40px] rounded-full bg-cover bg-center bg-no-repeat'
                        style={{
                          backgroundImage: `url(${
                            u.avatarUrl || '/images/profile-foto.png'
                          })`,
                        }}
                      />
                      <div className='flex flex-col'>
                        <span className="font-['SF_Pro'] text-[14px] font-bold leading-[20px] text-[#fdfdfd]">
                          {u.name || u.username}
                        </span>
                        <span className="font-['SF_Pro'] text-[12px] leading-[16px] text-[#a4a7ae]">
                          {u.username}
                        </span>
                      </div>
                    </div>
                    {u.isMe ? (
                      <div className='w-[96px]' />
                    ) : following ? (
                      <button
                        type='button'
                        disabled={disabled}
                        className='flex items-center gap-[8px] px-[16px] h-[36px] rounded-[999px] bg-transparent border border-[#2a2f3a] text-[#fdfdfd] hover:bg-[#11151b]'
                        onClick={() => unfollowMutation.mutate(u.username)}
                      >
                        <span className='w-[16px] h-[16px] rounded-full border border-[#fdfdfd] inline-flex items-center justify-center'>
                          ✓
                        </span>
                        <span className="font-['SF_Pro'] text-[14px] font-medium">
                          Following
                        </span>
                      </button>
                    ) : (
                      <button
                        type='button'
                        disabled={disabled}
                        className='px-[20px] h-[36px] rounded-[999px] bg-[#7e51f8] text-white hover:opacity-90'
                        onClick={() => followMutation.mutate(u.username)}
                      >
                        <span className="font-['SF_Pro'] text-[14px] font-bold">
                          Follow
                        </span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
