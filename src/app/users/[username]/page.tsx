'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUserLikes,
  fetchUserPosts,
  followUser,
  unfollowUser,
  fetchMySaved,
} from '@/lib/api';
import Navbar from '@/components/Navbar';
import UserListModal from '@/components/UserListModal';
import PostGridModal from '@/components/PostGridModal';
import Link from 'next/link';
import { toast } from 'sonner';

type NormalizedProfile = {
  id: number;
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  counts: { post: number; followers: number; following: number; likes: number };
  isMe: boolean;
};

type ApiUser = {
  id: number;
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  counts?: {
    post?: number;
    followers?: number;
    following?: number;
    likes?: number;
  };
  isMe?: boolean;
  isFollowedByMe?: boolean;
};

export default function UserProfilePage() {
  const params = useParams<{ username: string }>();
  const routeUsername = params?.username;
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [selfUsername, setSelfUsername] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<NormalizedProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'liked' | 'saved'>(
    'gallery'
  );
  const [openUserList, setOpenUserList] = useState<null | {
    mode: 'followers' | 'following';
  }>(null);
  const [openPostGrid, setOpenPostGrid] = useState<null | {
    mode: 'posts' | 'likes';
  }>(null);
  const isSelf = useMemo(
    () => mounted && selfUsername && routeUsername === selfUsername,
    [mounted, selfUsername, routeUsername]
  );

  useEffect(() => {
    setMounted(true);
    const t =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const un =
      typeof window !== 'undefined' ? localStorage.getItem('username') : null;
    setToken(t);
    setSelfUsername(un);
  }, []);

  useEffect(() => {
    if (!routeUsername) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // If viewing own profile, we could call /api/me, but /api/users/:username already provides needed fields
        const headers: Record<string, string> = { accept: '*/*' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(
          `https://socialmediaapi-production-fc0e.up.railway.app/api/users/${encodeURIComponent(
            routeUsername
          )}`,
          { headers, cache: 'no-store' }
        );
        const json = await res.json();
        if (!res.ok || json?.success !== true) {
          throw new Error(json?.message || 'Failed to load user');
        }
        const data = json.data as ApiUser;
        const normalized: NormalizedProfile = {
          id: data.id,
          name: data.name,
          username: data.username,
          bio: data.bio ?? null,
          avatarUrl: data.avatarUrl ?? null,
          counts: {
            post: data.counts?.post ?? 0,
            followers: data.counts?.followers ?? 0,
            following: data.counts?.following ?? 0,
            likes: data.counts?.likes ?? 0,
          },
          isMe: !!data.isMe,
        };
        setProfile(normalized);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load user');
      } finally {
        setLoading(false);
      }
    })();
  }, [routeUsername, token]);

  // Follow status query
  const { data: followStatus, isLoading: followStatusLoading } = useQuery({
    queryKey: ['followStatus', routeUsername],
    queryFn: async () => {
      if (!token || !routeUsername || isSelf) return false;

      // Since API doesn't return isFollowedByMe, we'll use localStorage as fallback
      // In production, this should be replaced with actual API call
      const followKey = `follow_${routeUsername}`;
      return localStorage.getItem(followKey) === 'true';
    },
    enabled: !!token && !!routeUsername && !isSelf && mounted,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!token || !profile) throw new Error('Missing token or profile');
      return followUser(profile.username, token);
    },
    onMutate: async () => {
      // Optimistic update
      const followKey = `follow_${routeUsername}`;
      localStorage.setItem(followKey, 'true');
      queryClient.setQueryData(['followStatus', routeUsername], true);

      // Update follower count optimistically
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              counts: { ...prev.counts, followers: prev.counts.followers + 1 },
            }
          : null
      );
    },
    onSuccess: () => {
      toast.success('Followed successfully');
    },
    onError: (error) => {
      // Revert optimistic update on error
      const followKey = `follow_${routeUsername}`;
      localStorage.setItem(followKey, 'false');
      queryClient.setQueryData(['followStatus', routeUsername], false);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              counts: { ...prev.counts, followers: prev.counts.followers - 1 },
            }
          : null
      );

      toast.error(
        error instanceof Error ? error.message : 'Failed to follow user'
      );
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!token || !profile) throw new Error('Missing token or profile');
      return unfollowUser(profile.username, token);
    },
    onMutate: async () => {
      // Optimistic update
      const followKey = `follow_${routeUsername}`;
      localStorage.setItem(followKey, 'false');
      queryClient.setQueryData(['followStatus', routeUsername], false);

      // Update follower count optimistically
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              counts: { ...prev.counts, followers: prev.counts.followers - 1 },
            }
          : null
      );
    },
    onSuccess: () => {
      toast.success('Unfollowed successfully');
    },
    onError: (error) => {
      // Revert optimistic update on error
      const followKey = `follow_${routeUsername}`;
      localStorage.setItem(followKey, 'true');
      queryClient.setQueryData(['followStatus', routeUsername], true);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              counts: { ...prev.counts, followers: prev.counts.followers + 1 },
            }
          : null
      );

      toast.error(
        error instanceof Error ? error.message : 'Failed to unfollow user'
      );
    },
  });

  const handleFollow = () => {
    if (!token || !profile || isSelf) return;

    if (followStatus) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return (
    <div className='w-full max-w-[1440px] min-h-screen bg-[#000] mx-auto relative pb-[96px]'>
      <Navbar />
      <div className='flex w-full max-w-[812px] flex-col gap-[16px] items-start mx-auto mt-[24px] px-[16px] lg:px-0'>
        {loading && (
          <div className='text-[#a4a7ae] font-sfpro text-sm'>
            Loading profile...
          </div>
        )}
        {error && (
          <div className='text-red-400 font-sfpro text-sm'>{error}</div>
        )}
        {profile && (
          <>
            {/* Desktop Layout */}
            <div className='hidden lg:flex justify-between items-center self-stretch'>
              <div className='flex w-[157px] gap-[20px] items-end'>
                <div
                  className='w-[64px] h-[64px] shrink-0 rounded-[50%] bg-cover bg-no-repeat'
                  style={{
                    backgroundImage: `url(${
                      profile.avatarUrl || '/images/profile-foto.png'
                    })`,
                  }}
                />
                <div className='flex flex-col items-start'>
                  <span className="h-[30px] font-['SF_Pro'] text-[16px] font-bold leading-[30px] text-[#fdfdfd] tracking-[-0.32px]">
                    {profile.name}
                  </span>
                  <span className="h-[30px] font-['SF_Pro'] text-[16px] leading-[30px] text-[#fdfdfd] tracking-[-0.32px]">
                    {profile.username}
                  </span>
                </div>
              </div>
              <div className='flex w-[190px] gap-[12px] items-center'>
                {isSelf ? (
                  <Link
                    href='/users/profile/edit'
                    className='flex w-[130px] h-[48px] p-[8px] justify-center items-center rounded-[100px] border border-[#181d27]'
                  >
                    <span className="font-['SF_Pro'] text-[16px] font-bold text-[#fdfdfd]">
                      Edit Profile
                    </span>
                  </Link>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={
                      followMutation.isPending ||
                      unfollowMutation.isPending ||
                      followStatusLoading
                    }
                    className={`flex w-[130px] h-[48px] p-[8px] justify-center items-center rounded-[100px] border ${
                      followStatus
                        ? 'border-[#181d27] bg-[#181d27]'
                        : 'border-[#6936f2] bg-[#6936f2]'
                    } disabled:opacity-50`}
                  >
                    <span className="font-['SF_Pro'] text-[16px] font-bold text-[#fdfdfd]">
                      {followMutation.isPending || unfollowMutation.isPending
                        ? '...'
                        : followStatus
                        ? 'Following'
                        : 'Follow'}
                    </span>
                  </button>
                )}
                <div className='flex w-[48px] h-[48px] p-[8px] justify-center items-center rounded-full border border-[#181d27]'>
                  <div className='w-[24px] h-[24px] bg-[url(/images/share-icon.svg)] bg-cover bg-no-repeat' />
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className='flex lg:hidden flex-col gap-[16px] w-full'>
              {/* Avatar and Name Row */}
              <div className='flex gap-[16px] items-start'>
                <div
                  className='w-[80px] h-[80px] shrink-0 rounded-[50%] bg-cover bg-no-repeat'
                  style={{
                    backgroundImage: `url(${
                      profile.avatarUrl || '/images/profile-foto.png'
                    })`,
                  }}
                />

                {/* Name and Username */}
                <div className='flex flex-col items-start gap-[4px] flex-1'>
                  <span className="font-['SF_Pro'] text-[18px] font-bold text-[#fdfdfd]">
                    {profile.name}
                  </span>
                  <span className="font-['SF_Pro'] text-[16px] text-[#fdfdfd]">
                    {profile.username}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className='flex gap-[12px] items-center'>
                {isSelf ? (
                  <Link
                    href='/users/profile/edit'
                    className='flex w-[309px] h-[40px] p-[8px] justify-center items-center rounded-[100px] border border-[#181d27]'
                  >
                    <span className="font-['SF_Pro'] text-[16px] font-bold text-[#fdfdfd]">
                      Edit Profile
                    </span>
                  </Link>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={
                      followMutation.isPending ||
                      unfollowMutation.isPending ||
                      followStatusLoading
                    }
                    className={`flex w-[309px] h-[40px] p-[8px] justify-center items-center rounded-[100px] border ${
                      followStatus
                        ? 'border-[#181d27] bg-[#181d27]'
                        : 'border-[#6936f2] bg-[#6936f2]'
                    } disabled:opacity-50`}
                  >
                    <span className="font-['SF_Pro'] text-[16px] font-bold text-[#fdfdfd]">
                      {followMutation.isPending || unfollowMutation.isPending
                        ? '...'
                        : followStatus
                        ? 'Following'
                        : 'Follow'}
                    </span>
                  </button>
                )}
                <div className='flex w-[48px] h-[48px] p-[8px] justify-center items-center rounded-full border border-[#181d27]'>
                  <div className='w-[24px] h-[24px] bg-[url(/images/share-icon.svg)] bg-cover bg-no-repeat' />
                </div>
              </div>
            </div>

            {profile.bio && (
              <span className="font-['SF_Pro'] text-[16px] leading-[30px] text-[#fdfdfd]">
                {profile.bio}
              </span>
            )}

            <div className='flex gap-[24px] items-center self-stretch'>
              <button
                type='button'
                className='grow min-w-0 p-0 bg-transparent border-0'
                onClick={() => setOpenPostGrid({ mode: 'posts' })}
              >
              <Stat label='Post' value={profile.counts.post} />
              </button>
              <div className='w-px self-stretch bg-[#181d27]' />
              <button
                type='button'
                className='grow min-w-0 p-0 bg-transparent border-0'
                onClick={() => setOpenUserList({ mode: 'followers' })}
              >
              <Stat label='Followers' value={profile.counts.followers} />
              </button>
              <div className='w-px self-stretch bg-[#181d27]' />
              <button
                type='button'
                className='grow min-w-0 p-0 bg-transparent border-0'
                onClick={() => setOpenUserList({ mode: 'following' })}
              >
              <Stat label='Following' value={profile.counts.following} />
              </button>
              <div className='w-px self-stretch bg-[#181d27]' />
              <button
                type='button'
                className='grow min-w-0 p-0 bg-transparent border-0'
                onClick={() => setOpenPostGrid({ mode: 'likes' })}
              >
              <Stat label='Likes' value={profile.counts.likes} />
              </button>
            </div>

            <div className='flex items-center self-stretch'>
              <button
                className={`flex h-[48px] px-[24px] gap-[12px] items-center grow border-t ${
                  activeTab === 'gallery'
                    ? 'border-t-2 border-t-[#fdfdfd]'
                    : 'border-t border-t-[#181d27]'
                }`}
                onClick={() => setActiveTab('gallery')}
              >
                <div className='w-[24px] h-[24px] bg-[url(/images/gallery.png)] bg-cover bg-no-repeat' />
                <span
                  className={`font-['SF_Pro'] text-[16px] ${
                    activeTab === 'gallery'
                      ? 'font-bold text-[#fdfdfd]'
                      : 'font-[510] text-[#a4a7ae]'
                  }`}
                >
                  Gallery
                </span>
              </button>
              {isSelf ? (
              <button
                className={`flex h-[48px] px-[24px] gap-[12px] items-center grow border-t ${
                  activeTab === 'saved'
                    ? 'border-t-2 border-t-[#fdfdfd]'
                    : 'border-t border-t-[#181d27]'
                }`}
                onClick={() => setActiveTab('saved')}
              >
                <div className='w-[24px] h-[24px] bg-[url(/images/pin-icon.svg)] bg-cover bg-no-repeat' />
                <span
                  className={`font-['SF_Pro'] text-[16px] ${
                    activeTab === 'saved'
                      ? 'font-bold text-[#fdfdfd]'
                      : 'font-[510] text-[#a4a7ae]'
                  }`}
                >
                  Saved
                </span>
              </button>
              ) : (
                <button
                  className={`flex h-[48px] px-[24px] gap-[12px] items-center grow border-t ${
                    activeTab === 'liked'
                      ? 'border-t-2 border-t-[#fdfdfd]'
                      : 'border-t border-t-[#181d27]'
                  }`}
                  onClick={() => setActiveTab('liked')}
                >
                  <div className='w-[24px] h-[24px] bg-[url(/images/like-icon.svg)] bg-cover bg-no-repeat' />
                  <span
                    className={`font-['SF_Pro'] text-[16px] ${
                      activeTab === 'liked'
                        ? 'font-bold text-[#fdfdfd]'
                        : 'font-[510] text-[#a4a7ae]'
                    }`}
                  >
                    Liked
                  </span>
                </button>
              )}
            </div>

            {activeTab === 'gallery' ? (
              <GalleryGrid username={profile.username} />
            ) : activeTab === 'liked' ? (
              <LikedGrid username={profile.username} />
            ) : (
              <SavedGrid token={token} />
            )}
          </>
        )}
        {/* Bottom navigation - fixed at bottom, responsive mobile and desktop */}
        <div className='flex w-[320px] lg:w-[360px] h-[60px] lg:h-[80px] gap-[30px] lg:gap-[45px] justify-center items-center flex-nowrap bg-[#0a0d12] rounded-[1000px] border-solid border border-[#181d27] fixed bottom-2 left-0 right-0 mx-auto z-[200]'>
          <Link
            href='/'
            className='flex w-[94px] flex-col gap-[4px] justify-center items-center shrink-0 flex-nowrap relative z-[131]'
          >
            <div className='w-[24px] h-[24px] shrink-0 relative z-[132]'>
              <div className='w-[24px] h-[24px] bg-[url(/images/home-icon.svg)] bg-cover bg-no-repeat absolute top-0 left-0 z-[133]' />
            </div>
            <span className="h-[30px] self-stretch shrink-0 basis-auto font-['SF_Pro'] text-[16px] font-normal leading-[30px] text-[#fdfdfd] tracking-[-0.32px] relative text-center overflow-hidden whitespace-nowrap z-[134]">
              Home
            </span>
          </Link>
          <Link
            href='/posts/new'
            className='flex w-[48px] h-[48px] pt-[8px] pr-[8px] pb-[8px] pl-[8px] gap-[8px] justify-center items-center shrink-0 flex-nowrap bg-[#6936f2] rounded-full relative z-[135]'
          >
            <div className='w-[24px] h-[24px] shrink-0 bg-[url(/images/plus-icon.svg)] bg-cover bg-no-repeat relative overflow-hidden z-[136]' />
          </Link>
          <Link
            href='/users/profile'
            className='flex w-[94px] flex-col gap-[4px] justify-center items-center shrink-0 flex-nowrap relative z-[137]'
          >
            <div className='w-[24px] h-[24px] shrink-0 relative z-[138]'>
              <div className='w-[24px] h-[24px] bg-[url(/images/profile-icon.svg)] bg-cover bg-no-repeat absolute top-0 left-0 z-[139]' />
            </div>
            <span className="h-[30px] self-stretch shrink-0 basis-auto font-['SF_Pro'] text-[16px] font-bold leading-[30px] text-[#7e51f8] tracking-[-0.32px] relative text-center overflow-hidden whitespace-nowrap z-[140]">
              Profile
            </span>
          </Link>
        </div>
        {openUserList && profile && (
          <UserListModal
            username={profile.username}
            mode={openUserList.mode}
            token={token}
            onClose={() => setOpenUserList(null)}
          />
        )}
        {openPostGrid && profile && (
          <PostGridModal
            username={profile.username}
            mode={openPostGrid.mode}
            onClose={() => setOpenPostGrid(null)}
          />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className='flex flex-col gap-[2px] items-center grow'>
      <span className="h-[34px] font-['SF_Pro'] text-[20px] font-bold leading-[34px] text-[#fdfdfd] tracking-[-0.4px]">
        {value}
      </span>
      <span className="h-[30px] font-['SF_Pro'] text-[16px] leading-[30px] text-[#a4a7ae] tracking-[-0.32px]">
        {label}
      </span>
    </div>
  );
}

function GalleryGrid({ username }: { username: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Array<{ imageUrl?: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchUserPosts(username, 1, 20);
        const posts = (data.posts || []) as Array<{
          imageUrl?: string;
          mediaUrl?: string;
          images?: string[];
        }>;
        setItems(
          posts.map((p) => ({
            imageUrl:
              p.imageUrl || p.mediaUrl || (p.images && p.images[0]) || '',
          }))
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  if (loading)
    return (
      <div className='text-[#a4a7ae] font-sfpro text-sm'>
        Loading gallery...
      </div>
    );
  if (error)
    return <div className='text-red-400 font-sfpro text-sm'>{error}</div>;
  if (!items.length)
    return (
      <div className='text-[#a4a7ae] font-sfpro text-sm'>No posts yet.</div>
    );

  return (
    <div className='grid grid-cols-3 gap-[4px] self-stretch'>
      {items.map((it, idx) => (
        <div
          key={idx}
          className='w-full pt-[100%] rounded-[6px] bg-cover bg-no-repeat'
          style={{
            backgroundImage: `url(${
              it.imageUrl || '/images/gradient-desktop.svg'
            })`,
          }}
        />
      ))}
    </div>
  );
}

function LikedGrid({ username }: { username: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Array<{ imageUrl?: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchUserLikes(username, 1, 20);
        const posts = (data.posts || []) as Array<{
          imageUrl?: string;
          mediaUrl?: string;
          images?: string[];
        }>;
        setItems(
          posts.map((p) => ({
            imageUrl:
              p.imageUrl || p.mediaUrl || (p.images && p.images[0]) || '',
          }))
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load liked');
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  if (loading)
    return (
      <div className='text-[#a4a7ae] font-sfpro text-sm'>Loading liked...</div>
    );
  if (error)
    return <div className='text-red-400 font-sfpro text-sm'>{error}</div>;
  if (!items.length)
    return (
      <div className='text-[#a4a7ae] font-sfpro text-sm'>
        No liked posts yet.
      </div>
    );

  return (
    <div className='grid grid-cols-3 gap-[4px] self-stretch'>
      {items.map((it, idx) => (
        <div
          key={idx}
          className='w-full pt-[100%] rounded-[6px] bg-cover bg-no-repeat'
          style={{
            backgroundImage: `url(${
              it.imageUrl || '/images/gradient-desktop.svg'
            })`,
          }}
        />
      ))}
    </div>
  );
}

function SavedGrid({ token }: { token: string | null }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Array<{ imageUrl?: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        if (!token) {
          setItems([]);
        } else {
          const data = await fetchMySaved(1, 20, token);
          const posts = (data.posts || []) as Array<{
            imageUrl?: string;
            mediaUrl?: string;
            images?: string[];
          }>;
          setItems(
            posts.map((p) => ({
              imageUrl:
                p.imageUrl || p.mediaUrl || (p.images && p.images[0]) || '',
            }))
          );
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load saved');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading)
    return (
      <div className='text-[#a4a7ae] font-sfpro text-sm'>Loading saved...</div>
    );
  if (error)
    return <div className='text-red-400 font-sfpro text-sm'>{error}</div>;
  if (!items.length)
    return (
      <div className='text-[#a4a7ae] font-sfpro text-sm'>
        No saved posts yet.
      </div>
    );

  return (
    <div className='grid grid-cols-3 gap-[4px] self-stretch'>
      {items.map((it, idx) => (
        <div
          key={idx}
          className='w-full pt-[100%] rounded-[6px] bg-cover bg-no-repeat'
          style={{
            backgroundImage: `url(${
              it.imageUrl || '/images/gradient-desktop.svg'
            })`,
          }}
        />
      ))}
    </div>
  );
}
