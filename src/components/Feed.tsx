'use client';
import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  fetchFeed,
  likePost,
  unlikePost,
  fetchPostLikes,
  fetchPostComments,
  savePost,
  unsavePost,
  fetchMySaved,
  deletePost,
} from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CommentModal from '@/components/CommentModal';
import LikesModal from '@/components/LikesModal';

type FeedUser = {
  username?: string;
  name?: string;
  avatarUrl?: string;
};

type FeedItem = {
  id?: number;
  user?: FeedUser;
  author?: FeedUser;
  profile?: FeedUser;
  createdAt?: string;
  postedAt?: string;
  imageUrl?: string;
  mediaUrl?: string;
  photoUrl?: string;
  images?: string[];
  caption?: string;
  text?: string;
  content?: string;
  counts?: { likes?: number; comments?: number };
  likes?: number;
  comments?: number;
  likedByMe?: boolean;
};

type FeedData = {
  items: FeedItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function Feed() {
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();
  useEffect(() => setMounted(true), []);
  const token = mounted ? localStorage.getItem('token') : null;
  const currentUsername = mounted ? localStorage.getItem('username') : null;
  const FEED_KEY = ['feed', token] as const;

  // Try to fetch personal feed first
  const {
    data: feedData,
    isLoading: feedLoading,
    error: feedError,
  } = useQuery({
    queryKey: FEED_KEY,
    queryFn: () => fetchFeed(1, 20, token),
    enabled: !!token && mounted,
    staleTime: 60_000,
  });

  const items = (feedData as FeedData)?.items || [];
  // Fetch accurate like/comment totals for each post
  const likesQueries = useQueries({
    queries: items.map((it) => ({
      queryKey: ['postLikesCount', it.id as number],
      queryFn: async () => {
        const res = await fetchPostLikes(it.id as number, 1, 1, token);
        return res.pagination?.total ?? 0;
      },
      enabled: mounted && !!(it.id as number),
      staleTime: 60_000,
    })),
  });

  const commentsQueries = useQueries({
    queries: items.map((it) => ({
      queryKey: ['postCommentsTotal', it.id as number],
      queryFn: async () => {
        const res = await fetchPostComments(it.id as number, 1, 1);
        return res.pagination?.total ?? 0;
      },
      enabled: mounted && !!(it.id as number),
      staleTime: 60_000,
    })),
  });
  // Fetch my saved page 1 for accurate saved flag
  const { data: mySavedData } = useQuery({
    queryKey: ['mySaved', token, 1],
    queryFn: () => fetchMySaved(1, 20, token),
    enabled: !!token && mounted,
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const savedIdSet = new Set(
    (
      (
        mySavedData as unknown as {
          posts?: Array<{
            id?: number;
            postId?: number;
            post?: { id?: number };
          }>;
        }
      )?.posts || []
    )
      .map((p) => {
        const raw =
          (p.id as unknown) ?? (p.postId as unknown) ?? (p.post?.id as unknown);
        if (typeof raw === 'number') return raw;
        if (typeof raw === 'string') {
          const n = parseInt(raw, 10);
          return Number.isFinite(n) ? n : undefined;
        }
        return undefined;
      })
      .filter((id): id is number => typeof id === 'number')
  );
  const [openCommentForPostId, setOpenCommentForPostId] = useState<
    number | null
  >(null);
  const [openLikesForPostId, setOpenLikesForPostId] = useState<number | null>(
    null
  );

  const isLoading = feedLoading;
  const error = feedError;

  const likeMutation = useMutation({
    mutationFn: async ({
      postId,
      token,
    }: {
      postId: number;
      token: string;
    }) => {
      console.log('Like mutation called:', { postId, token });
      return likePost(postId, token);
    },
    onMutate: async ({ postId }) => {
      console.log('Like onMutate called:', { postId });
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      // Snapshot previous value
      const previousFeed = queryClient.getQueryData(['feed']);
      console.log('Previous feed data:', previousFeed);

      // Optimistically update
      queryClient.setQueryData(['feed'], (old: FeedData | undefined) => {
        if (!old?.items) return old;
        console.log('Updating feed data for like:', { old, postId });
        return {
          ...old,
          items: old.items.map((item: FeedItem) => {
            if (item.id === postId) {
              const updatedItem = {
                ...item,
                likedByMe: true,
                counts: {
                  ...item.counts,
                  likes: (item.counts?.likes || 0) + 1,
                },
                likes: (item.likes || 0) + 1,
              };
              console.log('Updated item:', {
                before: item,
                after: updatedItem,
              });
              return updatedItem;
            }
            return item;
          }),
        };
      });

      return { previousFeed };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed'], context.previousFeed);
      }
    },
    onSuccess: async (_data, vars) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({
          queryKey: ['postLikesCount', vars.postId],
        }),
      ]);
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async ({
      postId,
      token,
    }: {
      postId: number;
      token: string;
    }) => {
      return unlikePost(postId, token);
    },
    onMutate: async ({ postId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      // Snapshot previous value
      const previousFeed = queryClient.getQueryData(['feed']);

      // Optimistically update
      queryClient.setQueryData(['feed'], (old: FeedData | undefined) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((item: FeedItem) => {
            if (item.id === postId) {
              return {
                ...item,
                likedByMe: false,
                counts: {
                  ...item.counts,
                  likes: Math.max((item.counts?.likes || 0) - 1, 0),
                },
                likes: Math.max((item.likes || 0) - 1, 0),
              };
            }
            return item;
          }),
        };
      });

      return { previousFeed };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed'], context.previousFeed);
      }
    },
    onSuccess: async (_data, vars) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({
          queryKey: ['postLikesCount', vars.postId],
        }),
      ]);
    },
  });

  // Avoid hydration mismatch: render nothing until mounted so SSR/CSR match
  if (!mounted) return null;

  if (isLoading)
    return (
      <div className='text-[#a4a7ae] font-sfpro text-sm px-[16px] lg:px-0'>
        Loading feed...
      </div>
    );
  if (error)
    return (
      <div className='text-red-400 font-sfpro text-sm px-[16px] lg:px-0'>
        {(error as Error).message}
      </div>
    );

  return (
    <div className='flex w-full max-w-[600px] flex-col gap-[24px] items-start relative mx-auto px-[16px] lg:px-0'>
      {!token ? (
        <div className='text-[#a4a7ae] font-sfpro text-sm'>
          Login to see your feed.
        </div>
      ) : items.length === 0 ? (
        <div className='text-[#a4a7ae] font-sfpro text-sm'>
          No feed items yet.
        </div>
      ) : (
        items.map((item, idx) => {
          const user = item.user || item.author || item.profile || {};
          const username: string = user.username || user.name || 'user';
          const name: string = user.name || user.username || 'User';
          const avatarUrl: string = user.avatarUrl || '';
          const createdAt: string = item.createdAt || item.postedAt || '';
          const imageUrl: string =
            item.imageUrl ||
            item.mediaUrl ||
            item.photoUrl ||
            (item.images && item.images[0]) ||
            '';
          const caption: string =
            item.caption || item.text || item.content || '';
          const likedByMe: boolean = item.likedByMe ?? false;
          const likeCount: number =
            likesQueries[idx]?.data ??
            ((item.counts && item.counts.likes) || item.likes || 0);
          const commentCount: number =
            commentsQueries[idx]?.data ??
            ((item.counts && item.counts.comments) || item.comments || 0);
          const savedFlag = (item as unknown as { savedByMe?: boolean })
            .savedByMe;
          const itemIdRaw = item.id as unknown;
          const itemId: number | undefined =
            typeof itemIdRaw === 'number'
              ? itemIdRaw
              : typeof itemIdRaw === 'string'
              ? Number.isFinite(parseInt(itemIdRaw, 10))
                ? parseInt(itemIdRaw, 10)
                : undefined
              : undefined;
          const savedByMe: boolean =
            typeof savedFlag === 'boolean'
              ? savedFlag
              : itemId !== undefined && savedIdSet.has(itemId);

          return (
            <Fragment key={(item.id as number | undefined) ?? idx}>
              <div className='flex flex-col gap-[12px] items-start self-stretch'>
                {/* Header */}
                {(() => {
                  const isSelf =
                    !!currentUsername &&
                    (user.username === currentUsername ||
                      user.name === currentUsername);
                  const profileHref = isSelf
                    ? '/users/profile'
                    : `/users/${encodeURIComponent(username)}`;
                  return (
                    <Link
                      href={profileHref}
                      className='flex gap-[12px] items-center self-stretch hover:opacity-80 transition-opacity'
                    >
                      <div
                        className='w-[64px] h-[64px] shrink-0 rounded-[50%] bg-cover bg-no-repeat'
                        style={{
                          backgroundImage: `url(${
                            avatarUrl || '/images/profile-foto.png'
                          })`,
                        }}
                      />
                      <div className='flex flex-col items-start grow'>
                        <span className="h-[30px] font-['SF_Pro'] text-[16px] font-bold leading-[30px] text-[#fdfdfd] tracking-[-0.32px]">
                          {name}
                        </span>
                        <span className="h-[28px] font-['SF_Pro'] text-[14px] font-normal leading-[28px] text-[#a4a7ae] tracking-[-0.28px]">
                          {createdAt
                            ? new Date(createdAt).toLocaleString()
                            : '@' + username}
                        </span>
                      </div>
                    </Link>
                  );
                })()}
                {/* Media */}
                {imageUrl && (
                  <div
                    className='w-full h-[300px] lg:h-[600px] self-stretch rounded-[8px] bg-cover bg-no-repeat cursor-pointer'
                    style={{ backgroundImage: `url(${imageUrl})` }}
                    onClick={() => {
                      const numericId = item.id as number | undefined;
                      if (!numericId) return;
                      setOpenLikesForPostId(numericId);
                    }}
                  />
                )}
                {/* Actions */}
                <div className='flex justify-between items-center self-stretch'>
                  <div className='flex w-[185px] gap-[16px] items-center'>
                    <button
                      type='button'
                      onClick={() => {
                        if (!mounted) return;
                        const t = localStorage.getItem('token');
                        if (!t) return;
                        const numericId = item.id as number | undefined;
                        if (!numericId) {
                          console.log('No post ID found:', item);
                          return;
                        }
                        console.log('Like button clicked:', {
                          postId: numericId,
                          likedByMe,
                          likeCount,
                        });
                        if (likedByMe) {
                          unlikeMutation.mutate({
                            postId: numericId,
                            token: t,
                          });
                        } else {
                          likeMutation.mutate({ postId: numericId, token: t });
                        }
                      }}
                      className='flex w-[51px] gap-[6px] items-center hover:opacity-80 transition-opacity'
                      disabled={false}
                    >
                      <div className='w-[24px] h-[24px]'>
                        <div
                          className='w-[24px] h-[24px] bg-cover bg-no-repeat'
                          style={{
                            backgroundImage: likedByMe
                              ? 'url(/images/like-icon.svg)'
                              : 'url(/images/like-icon.svg)',
                            filter: likedByMe ? 'hue-rotate(270deg)' : 'none',
                          }}
                        />
                      </div>
                      <span className="h-[30px] font-['SF_Pro'] text-[16px] font-[590] leading-[30px] text-[#fdfdfd] tracking-[-0.32px]">
                        {likeCount}
                      </span>
                    </button>
                    <button
                      type='button'
                      className='flex w-[51px] gap-[6px] items-center hover:opacity-80 transition-opacity'
                      onClick={() => {
                        const numericId = item.id as number | undefined;
                        if (!numericId) return;
                        setOpenCommentForPostId(numericId);
                      }}
                    >
                      <div className='w-[24px] h-[24px]'>
                        <div className='w-[24px] h-[24px] bg-[url(/images/comment-icon.svg)] bg-cover bg-no-repeat' />
                      </div>
                      <span className="h-[30px] font-['SF_Pro'] text-[16px] font-[590] leading-[30px] text-[#fdfdfd] tracking-[-0.32px]">
                        {commentCount}
                      </span>
                    </button>
                    <button
                      type='button'
                      className='flex w-[51px] gap-[6px] items-center hover:opacity-80 transition-opacity'
                      onClick={() => {
                        // TODO: Implement share functionality
                        console.log('Share clicked for post:', item.id);
                      }}
                    >
                      <div className='w-[24px] h-[24px]'>
                        <div className='w-[24px] h-[24px] bg-[url(/images/share-icon.svg)] bg-cover bg-no-repeat' />
                      </div>
                    </button>
                  </div>
                  <button
                    type='button'
                    className='w-[24px] h-[24px] hover:opacity-80 transition-opacity'
                    onClick={() => {
                      if (!mounted) return;
                      const t = localStorage.getItem('token');
                      if (!t) return;
                      const numericId = item.id as number | undefined;
                      if (!numericId) return;
                      const isSaved = savedByMe;
                      const run = async () => {
                        try {
                          if (isSaved) {
                            await unsavePost(numericId, t);
                            queryClient.setQueryData(
                              FEED_KEY as unknown as ReadonlyArray<unknown>,
                              (old: FeedData | undefined) => {
                                if (!old?.items) return old;
                                return {
                                  ...old,
                                  items: old.items.map((it: FeedItem) =>
                                    it.id === numericId
                                      ? ({
                                          ...(it as unknown as {
                                            savedByMe?: boolean;
                                          }),
                                          savedByMe: false,
                                        } as FeedItem)
                                      : it
                                  ),
                                };
                              }
                            );
                            queryClient.invalidateQueries({
                              queryKey: ['mySaved', token, 1],
                            });
                          } else {
                            await savePost(numericId, t);
                            queryClient.setQueryData(
                              FEED_KEY as unknown as ReadonlyArray<unknown>,
                              (old: FeedData | undefined) => {
                                if (!old?.items) return old;
                                return {
                                  ...old,
                                  items: old.items.map((it: FeedItem) =>
                                    it.id === numericId
                                      ? ({
                                          ...(it as unknown as {
                                            savedByMe?: boolean;
                                          }),
                                          savedByMe: true,
                                        } as FeedItem)
                                      : it
                                  ),
                                };
                              }
                            );
                            queryClient.invalidateQueries({
                              queryKey: ['mySaved', token, 1],
                            });
                          }
                        } catch {}
                      };
                      run();
                    }}
                    title='Save'
                  >
                    <div
                      className='w-[18px] h-[20px] bg-cover bg-no-repeat'
                      style={{
                        backgroundImage: savedByMe
                          ? 'url(/images/saved.png)'
                          : 'url(/images/unsaved.png)',
                      }}
                    />
                  </button>
                  {/* If the post is mine, show delete */}
                  {currentUsername &&
                    (user.username === currentUsername ||
                      user.name === currentUsername) && (
                      <button
                        type='button'
                        className='ml-[8px] px-[10px] h-[28px] rounded-[8px] border border-[#181d27] text-[#f87171] hover:bg-[#11151b]'
                        onClick={() => {
                          if (!mounted) return;
                          const t = localStorage.getItem('token');
                          const uname = localStorage.getItem('username');
                          if (!t || !uname) return;
                          const numericId = item.id as number | undefined;
                          if (!numericId) return;
                          // optimistic removal
                          const previous = queryClient.getQueryData(FEED_KEY);
                          queryClient.setQueryData(
                            FEED_KEY,
                            (old: FeedData | undefined) => {
                              if (!old?.items) return old;
                              return {
                                ...old,
                                items: old.items.filter(
                                  (it) => it.id !== numericId
                                ),
                              };
                            }
                          );
                          deletePost(numericId, t)
                            .then(() => {
                              queryClient.invalidateQueries({
                                queryKey:
                                  FEED_KEY as unknown as ReadonlyArray<unknown>,
                              });
                            })
                            .catch(() => {
                              // rollback
                              queryClient.setQueryData(
                                FEED_KEY,
                                previous as unknown
                              );
                            });
                        }}
                        title='Delete post'
                      >
                        Delete
                      </button>
                    )}
                </div>
                {/* Caption */}
                {caption && (
                  <div className='flex w-full max-w-[526px] flex-col gap-[4px]'>
                    <span className="h-[30px] font-['SF_Pro'] text-[16px] font-bold leading-[30px] text-[#fdfdfd] tracking-[-0.32px]">
                      {name}
                    </span>
                    <CaptionWithToggle text={caption} />
                  </div>
                )}
                {idx < items.length - 1 && (
                  <div className='h-px self-stretch bg-[url(/images/line.svg)] bg-cover bg-no-repeat' />
                )}
              </div>

              {openCommentForPostId === (item.id as number) && (
                <CommentModal
                  postId={item.id as number}
                  imageUrl={imageUrl}
                  user={{
                    name: name,
                    username: username,
                    avatarUrl: avatarUrl,
                  }}
                  caption={caption}
                  createdAt={createdAt}
                  tokenOverride={token}
                  onClose={() => setOpenCommentForPostId(null)}
                />
              )}
              {openLikesForPostId === (item.id as number) && (
                <LikesModal
                  postId={item.id as number}
                  token={token}
                  onClose={() => setOpenLikesForPostId(null)}
                />
              )}
            </Fragment>
          );
        })
      )}
    </div>
  );
}

function CaptionWithToggle({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 140;
  const display = !isLong || expanded ? text : text.slice(0, 140) + '...';
  return (
    <div className='flex flex-col gap-[4px]'>
      <span className="flex w-full max-w-[526px] font-['SF_Pro'] text-[16px] font-normal leading-[30px] text-[#fdfdfd] tracking-[-0.32px]">
        {display}
      </span>
      {isLong && (
        <button
          type='button'
          className="h-[30px] w-fit font-['SF_Pro'] text-[16px] font-[590] leading-[30px] text-[#7e51f8]"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      )}
    </div>
  );
}
