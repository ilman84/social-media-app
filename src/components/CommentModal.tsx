'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  createPostComment,
  fetchPostComments,
  likePost,
  unlikePost,
  fetchPostLikes,
  savePost,
  unsavePost,
  deleteComment,
} from '@/lib/api';
import { toast } from 'sonner';

type CommentModalProps = {
  postId: number;
  imageUrl?: string;
  user: { name?: string; username?: string; avatarUrl?: string };
  caption?: string;
  createdAt?: string;
  likedByMe?: boolean;
  initialLikeCount?: number;
  initialCommentCount?: number;
  tokenOverride?: string | null;
  onClose: () => void;
};

export default function CommentModal({
  postId,
  imageUrl,
  user,
  caption,
  createdAt,
  onClose,
  likedByMe = false,
  initialLikeCount = 0,
  initialCommentCount = 0,
  tokenOverride = null,
}: CommentModalProps) {
  const [token, setToken] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [text, setText] = useState('');
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState<boolean>(likedByMe);
  const [saving, setSaving] = useState<boolean>(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiWrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const effectiveToken = tokenOverride ?? token;

  useEffect(() => {
    setToken(
      typeof window !== 'undefined' ? localStorage.getItem('token') : null
    );
    setMyUsername(
      typeof window !== 'undefined' ? localStorage.getItem('username') : null
    );
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchPostComments(postId, 1, 20),
    enabled: !!postId,
    staleTime: 30_000,
  });

  const comments = useMemo(() => data?.comments || [], [data]);
  const commentsTotal =
    (data as { pagination?: { total?: number } } | undefined)?.pagination
      ?.total ?? initialCommentCount;

  // Likes count (accurate from API pagination total)
  const { data: likesData } = useQuery({
    queryKey: ['postLikesCount', postId],
    queryFn: async () => {
      const res = await fetchPostLikes(postId, 1, 1, effectiveToken);
      return res.pagination?.total ?? 0;
    },
    enabled: !!postId,
    staleTime: 30_000,
    initialData: initialLikeCount,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!effectiveToken) throw new Error('Please login to comment');
      const trimmed = (content ?? '').trim();
      if (!trimmed) throw new Error('Comment cannot be empty');
      return createPostComment(postId, trimmed, effectiveToken);
    },
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      const previous = queryClient.getQueryData(['comments', postId]);
      const prevFeed = queryClient.getQueryData(['feed']) as
        | { items?: Array<unknown> }
        | undefined;
      const prevCommentsTotal = queryClient.getQueryData([
        'postCommentsTotal',
        postId,
      ]) as number | undefined;
      const optimistic = {
        id: Date.now(),
        text: content,
        createdAt: new Date().toISOString(),
        author: {
          id: 0,
          username: user.username || 'me',
          name: user.name || 'Me',
          avatarUrl: user.avatarUrl || null,
        },
        isMine: true,
      } as {
        id: number;
        text: string;
        createdAt: string;
        author: {
          id: number;
          username: string;
          name: string;
          avatarUrl: string | null;
        };
        isMine: boolean;
      };
      queryClient.setQueryData(
        ['comments', postId],
        (
          old:
            | {
                comments?: Array<{
                  id: number;
                  text: string;
                  createdAt: string;
                  author: {
                    id: number;
                    username: string;
                    name: string;
                    avatarUrl: string | null;
                  };
                  isMine?: boolean;
                }>;
              }
            | undefined
        ) => {
          const current = old?.comments || [];
          return { ...old, comments: [optimistic, ...current] };
        }
      );

      // Optimistically bump total comments counter for feed and total query
      queryClient.setQueryData(
        ['postCommentsTotal', postId],
        (prevCommentsTotal ?? 0) + 1
      );
      queryClient.setQueryData(
        ['feed'],
        (
          old:
            | {
                items?: Array<
                  {
                    id?: number;
                    counts?: { comments?: number };
                    comments?: number;
                  } & Record<string, unknown>
                >;
              }
            | undefined
        ) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((it) =>
              (it?.id as number | undefined) === postId
                ? {
                    ...it,
                    counts: {
                      ...(it.counts || {}),
                      comments: (it.counts?.comments || it.comments || 0) + 1,
                    },
                    comments: (it.comments || 0) + 1,
                  }
                : it
            ),
          };
        }
      );
      setText('');
      return { previous, prevFeed, prevCommentsTotal };
    },
    onError: (err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(['comments', postId], context.previous);
      console.error('Add comment failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add comment');
      if (context?.prevCommentsTotal !== undefined) {
        queryClient.setQueryData(
          ['postCommentsTotal', postId],
          context.prevCommentsTotal
        );
      }
      if (context?.prevFeed !== undefined) {
        queryClient.setQueryData(['feed'], context.prevFeed);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
        queryClient.invalidateQueries({
          queryKey: ['postCommentsTotal', postId],
        }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
      ]);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      if (!effectiveToken) throw new Error('Please login to delete');
      return deleteComment(commentId, effectiveToken);
    },
    onMutate: async (commentId: number) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      const previous = queryClient.getQueryData(['comments', postId]);
      const prevTotal = queryClient.getQueryData([
        'postCommentsTotal',
        postId,
      ]) as number | undefined;
      queryClient.setQueryData(
        ['comments', postId],
        (
          old:
            | {
                comments?: Array<{
                  id: number;
                  text: string;
                  createdAt: string;
                  author: {
                    id: number;
                    username: string;
                    name: string;
                    avatarUrl: string | null;
                  };
                  isMine?: boolean;
                }>;
              }
            | undefined
        ) => {
          if (!old?.comments) return old;
          return {
            ...old,
            comments: old.comments.filter((cc) => cc.id !== commentId),
          };
        }
      );
      queryClient.setQueryData(
        ['postCommentsTotal', postId],
        (old: number | undefined) => {
          const current = typeof old === 'number' ? old : 0;
          return Math.max(0, current - 1);
        }
      );
      return { previous, prevTotal };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(['comments', postId], ctx.previous);
      if (typeof ctx?.prevTotal === 'number') {
        queryClient.setQueryData(['postCommentsTotal', postId], ctx.prevTotal);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({
        queryKey: ['postCommentsTotal', postId],
      });
    },
  });

  // Like/unlike
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Please login to like');
      await likePost(postId, token);
    },
    onMutate: async () => {
      setLiked(true);
      await queryClient.cancelQueries({ queryKey: ['postLikesCount', postId] });
      const prev = queryClient.getQueryData(['postLikesCount', postId]);
      queryClient.setQueryData(
        ['postLikesCount', postId],
        ((prev as number | undefined) ?? 0) + 1
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      setLiked(false);
      if (ctx?.prev !== undefined)
        queryClient.setQueryData(['postLikesCount', postId], ctx.prev);
      toast.error('Failed to like');
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Please login to unlike');
      await unlikePost(postId, token);
    },
    onMutate: async () => {
      setLiked(false);
      await queryClient.cancelQueries({ queryKey: ['postLikesCount', postId] });
      const prev = queryClient.getQueryData(['postLikesCount', postId]);
      queryClient.setQueryData(
        ['postLikesCount', postId],
        Math.max(((prev as number | undefined) ?? 0) - 1, 0)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      setLiked(true);
      if (ctx?.prev !== undefined)
        queryClient.setQueryData(['postLikesCount', postId], ctx.prev);
      toast.error('Failed to unlike');
    },
  });

  // Prevent background scroll when modal open
  useEffect(() => {
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prev;
    };
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmoji) return;
    const handler = (e: MouseEvent) => {
      if (
        emojiWrapperRef.current &&
        !emojiWrapperRef.current.contains(e.target as Node)
      ) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji]);

  return (
    <div
      className='fixed inset-0 z-[500] flex items-start justify-center overflow-y-auto'
      style={{
        paddingTop: 'max(env(safe-area-inset-top),0px)',
        paddingBottom: 'max(env(safe-area-inset-bottom),0px)',
      }}
    >
      <div className='absolute inset-0 bg-black/60' onClick={onClose} />

      <div className='relative main-container flex w-[1200px] max-w-[95vw] flex-col items-center bg-transparent'>
        <div
          className='relative flex items-stretch bg-[#0a0d12] rounded-[12px] w-[1200px] max-w-[min(95vw,1200px)] h-auto lg:h-[720px] lg:max-h-[90vh] overflow-hidden'
          style={{
            height: '100dvh',
            maxHeight: '100dvh',
            scrollbarGutter: 'stable',
            overscrollBehavior: 'contain',
          }}
        >
          <button
            aria-label='Close comments'
            onClick={onClose}
            className='absolute top-[12px] right-[12px] w-[32px] h-[32px] flex items-center justify-center rounded-full bg-[#00000080] hover:bg-[#000000cc] z-[10]'
            title='Close'
          >
            <span className='text-[#fdfdfd] text-[20px] leading-none'>×</span>
          </button>
          {/* Left: Image */}
          <div
            className='w-[0px] lg:w-[720px] lg:h-full shrink-0 bg-cover bg-no-repeat hidden lg:block'
            style={{
              backgroundImage: `url(${
                imageUrl || '/images/gradient-desktop.svg'
              })`,
            }}
          />

          {/* Right: Details */}
          <div className='flex px-[12px] pt-[8px] pb-[8px] lg:p-[20px] flex-col gap-[10px] lg:gap-[16px] items-start grow min-w-0 min-h-0 h-full overflow-visible'>
            {/* Sticky (mobile) header + title wrapper */}
            <div className='sticky top-0 z-[6] bg-[#0a0d12] lg:static lg:z-auto lg:bg-transparent'>
              <div className='flex justify-between items-center w-full border-b border-[#181d27] py-[4px] lg:py-[8px]'>
                <div className='flex gap-[13px] items-center'>
                  <div
                    className='w-[40px] h-[40px] shrink-0 rounded-[50%] bg-cover bg-no-repeat'
                    style={{
                      backgroundImage: `url(${
                        user.avatarUrl || '/images/profile-foto.png'
                      })`,
                    }}
                  />
                  <div className='flex flex-col gap-[2px]'>
                    <Link
                      href={`/users/${encodeURIComponent(user.username || '')}`}
                    >
                      <span className="font-['SF_Pro'] text-[14px] font-bold leading-[28px] text-[#fdfdfd]">
                        {user.name || user.username || 'User'}
                      </span>
                    </Link>
                    <span className="font-['SF_Pro'] text-[12px] leading-[16px] text-[#a4a7ae]">
                      {createdAt ? new Date(createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                </div>
                <div className='w-[24px] h-[24px] shrink-0 flex items-center justify-center text-[#a4a7ae]'>
                  ⋯
                </div>
              </div>
              <span className="font-['SF_Pro'] text-[16px] font-bold text-[#fdfdfd] block py-[4px] lg:py-0">
                Comments
              </span>
            </div>

            {/* Caption */}
            {caption && (
              <span className="font-['SF_Pro'] text-[14px] leading-[28px] text-[#fdfdfd]">
                {caption}
              </span>
            )}

            {/* Comments Title (moved into sticky wrapper above) */}

            {/* Comments List */}
            <div className='flex flex-col gap-[6px] lg:gap-[10px] w-full pr-[2px] lg:pr-[4px] flex-1 min-h-0 mt-[4px] lg:mt-0 overflow-y-auto overscroll-contain'>
              {isLoading && (
                <div className='text-[#a4a7ae] text-sm'>
                  Loading comments...
                </div>
              )}
              {error && (
                <div className='text-red-400 text-sm'>
                  Failed to load comments
                </div>
              )}
              {!isLoading && !error && comments.length === 0 && (
                <div className='text-[#a4a7ae] text-sm'>No comments yet.</div>
              )}
              {comments.map(
                (c: {
                  id: number;
                  text: string;
                  createdAt: string;
                  author: {
                    username?: string;
                    name?: string;
                    avatarUrl?: string | null;
                  };
                  isMine?: boolean;
                }) => {
                  const ownComment =
                    (c as { isMine?: boolean }).isMine === true ||
                    (myUsername && c.author?.username === myUsername);
                  return (
                    <div key={c.id} className='flex flex-col gap-[4px] w-full'>
                      <div className='flex items-center justify-between'>
                        <div className='flex gap-[8px] items-center'>
                          <div
                            className='w-[40px] h-[40px] shrink-0 rounded-[50%] bg-cover bg-no-repeat'
                            style={{
                              backgroundImage: `url(${
                                c.author?.avatarUrl ||
                                '/images/profile-foto.png'
                              })`,
                            }}
                          />
                          <div className='flex flex-col gap-[2px]'>
                            <span className="font-['SF_Pro'] text-[14px] font-bold text-[#fdfdfd]">
                              {c.author?.name || c.author?.username || 'User'}
                            </span>
                            <span className="font-['SF_Pro'] text-[12px] text-[#a4a7ae]">
                              {c.createdAt
                                ? new Date(c.createdAt).toLocaleString()
                                : ''}
                            </span>
                          </div>
                        </div>
                        {ownComment && (
                          <button
                            type='button'
                            className="font-['SF_Pro'] text-[12px] text-[#f87171] hover:opacity-90"
                            disabled={deleteCommentMutation.isPending}
                            onClick={() => deleteCommentMutation.mutate(c.id)}
                            title='Delete comment'
                          >
                            {deleteCommentMutation.isPending ? '...' : 'Delete'}
                          </button>
                        )}
                      </div>
                      <span className="font-['SF_Pro'] text-[14px] text-[#fdfdfd]">
                        {c.text}
                      </span>
                      <div className='h-px w-full bg-[#181d27]' />
                    </div>
                  );
                }
              )}
            </div>

            {/* Add Comment */}
            {/* Bottom controls wrapper */}
            <div className='mt-auto w-full flex flex-col gap-[8px]'>
              {/* Action buttons (Like, Comment, Share, Saved) moved above Add Comment */}
              <div className='flex justify-between items-center w-full'>
                <div className='flex w-[220px] gap-[16px] items-center'>
                  <button
                    type='button'
                    onClick={() => {
                      if (!token) return toast.error('Please login');
                      if (liked) unlikeMutation.mutate();
                      else likeMutation.mutate();
                    }}
                    className='flex w-[51px] gap-[6px] items-center hover:opacity-80 transition-opacity'
                  >
                    <div className='w-[20px] h-[20px] lg:w-[24px] lg:h-[24px]'>
                      <div
                        className='w-[20px] h-[20px] lg:w-[24px] lg:h-[24px] bg-cover bg-no-repeat'
                        style={{
                          backgroundImage: 'url(/images/like-icon.svg)',
                          filter: liked ? 'hue-rotate(270deg)' : 'none',
                        }}
                      />
                    </div>
                    <span className="h-[30px] font-['SF_Pro'] text-[16px] font-[590] leading-[30px] text-[#fdfdfd] tracking-[-0.32px]">
                      {likesData as number}
                    </span>
                  </button>
                  <div className='flex w-[51px] gap-[6px] items-center'>
                    <div className='w-[20px] h-[20px] lg:w-[24px] lg:h-[24px]'>
                      <div className='w-[20px] h-[20px] lg:w-[24px] lg:h-[24px] bg-[url(/images/comment-icon.svg)] bg-cover bg-no-repeat' />
                    </div>
                    <span className="h-[30px] font-['SF_Pro'] text-[16px] font-[590] leading-[30px] text-[#fdfdfd] tracking-[-0.32px]">
                      {commentsTotal}
                    </span>
                  </div>
                  <button
                    type='button'
                    className='flex w-[51px] gap-[6px] items-center hover:opacity-80 transition-opacity'
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/posts/${postId}`
                        );
                        toast.success('Post link copied');
                      }
                    }}
                  >
                    <div className='w-[20px] h-[20px] lg:w-[24px] lg:h-[24px]'>
                      <div className='w-[20px] h-[20px] lg:w-[24px] lg:h-[24px] bg-[url(/images/share-icon.svg)] bg-cover bg-no-repeat' />
                    </div>
                  </button>
                </div>
                <button
                  type='button'
                  disabled={saving}
                  onClick={async () => {
                    if (!token) return toast.error('Please login');
                    try {
                      setSaving(true);
                      await savePost(postId, token);
                      toast.success('Saved');
                    } catch {
                      try {
                        await unsavePost(postId, token);
                        toast.success('Unsaved');
                      } catch {
                        toast.error('Failed to toggle saved');
                      }
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className='w-[20px] h-[20px] lg:w-[24px] lg:h-[24px] hover:opacity-80 transition-opacity'
                  title='Save'
                >
                  <div className='w-[20px] h-[20px] lg:w-[24px] lg:h-[24px] bg-[url(/images/pin-icon.svg)] bg-cover bg-no-repeat' />
                </button>
              </div>

              {/* Now the Add Comment input follows */}
              <div className='flex gap-[8px] items-start w-full'>
                <div
                  ref={emojiWrapperRef}
                  className='relative flex w-[48px] h-[48px] p-0 justify-center items-center rounded-[12px] border border-[#181d27]'
                >
                  <button
                    type='button'
                    aria-label='Pick emoji'
                    onClick={() => setShowEmoji((v) => !v)}
                    className='w-[20px] h-[20px] bg-[url(/images/emoji.png)] bg-contain bg-no-repeat bg-center hover:opacity-80'
                  />
                  {showEmoji && (
                    <div className='absolute bottom-[56px] left-1/2 -translate-x-1/2 w-[260px] max-w-[86vw] p-[10px] rounded-[12px] bg-[#0a0d12] border border-[#181d27] shadow-lg z-[30]'>
                      <div className='grid grid-cols-6 gap-[8px]'>
                        {[
                          '😀',
                          '😅',
                          '🥰',
                          '😇',
                          '😉',
                          '😛',
                          '🤪',
                          '🤫',
                          '😌',
                          '🤗',
                          '😴',
                          '🤧',
                          '🤭',
                          '😴',
                          '🥵',
                          '😭',
                          '😱',
                          '😘',
                          '😎',
                          '🤤',
                          '😢',
                          '😆',
                          '🙂',
                          '🤩',
                          '😮‍💨',
                          '😋',
                          '😙',
                          '😚',
                          '😐',
                          '😑',
                          '😒',
                          '🙄',
                          '😬',
                          '😳',
                          '🥲',
                          '🫠',
                          '🫡',
                        ].map((emo, i) => (
                          <button
                            key={`${emo}-${i}`}
                            type='button'
                            className='text-[20px] leading-none hover:scale-110 transition-transform'
                            onClick={() => {
                              setText((t) => t + emo);
                              setShowEmoji(false);
                              if (inputRef.current) inputRef.current.focus();
                            }}
                          >
                            {emo}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className='flex flex-col items-start grow gap-[6px]'>
                  <div className='flex h-[40px] lg:h-[48px] px-[12px] lg:px-[16px] gap-[8px] items-center w-full bg-[#0a0d12] rounded-[12px] border border-[#181d27]'>
                    <input
                      ref={inputRef}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder='Add Comment'
                      className="h-[30px] grow bg-transparent outline-none font-['SF_Pro'] text-[16px] text-[#fdfdfd] placeholder-[#535861]"
                    />
                    <button
                      type='button'
                      disabled={
                        !token || !text.trim() || addCommentMutation.isPending
                      }
                      onClick={() => addCommentMutation.mutate(text)}
                      className="h-[30px] font-['SF_Pro'] text-[16px] font-bold text-[#7e51f8] disabled:text-[#535861]"
                    >
                      {addCommentMutation.isPending ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                  {!token && (
                    <div className='text-[#a4a7ae] text-xs'>
                      Login to post a comment.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
