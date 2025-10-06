export async function fetchUserLikes(
  username: string,
  page: number = 1,
  limit: number = 20
) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/users/${encodeURIComponent(
    username
  )}/likes?page=${page}&limit=${limit}`;

  const res = await fetch(url, {
    headers: {
      accept: '*/*',
    },
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to fetch likes');
  }
  return json?.data as {
    posts: Array<unknown>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function fetchMyLikes(
  page: number = 1,
  limit: number = 20,
  token?: string | null
) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/me/likes?page=${page}&limit=${limit}`;
  const headers: Record<string, string> = { accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    headers,
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to fetch my likes');
  }
  return json?.data as {
    posts: Array<unknown>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function searchUsers(
  q: string,
  page: number = 1,
  limit: number = 20
) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/users/search?q=${encodeURIComponent(
    q
  )}&page=${page}&limit=${limit}`;

  const res = await fetch(url, {
    headers: { accept: '*/*' },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to search users');
  }
  return json?.data as {
    users: Array<{
      id: number;
      username: string;
      name: string;
      avatarUrl: string | null;
      isFollowedByMe: boolean;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function fetchUserPosts(
  username: string,
  page: number = 1,
  limit: number = 20
) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/users/${encodeURIComponent(
    username
  )}/posts?page=${page}&limit=${limit}`;

  const res = await fetch(url, {
    headers: { accept: '*/*' },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to fetch user posts');
  }
  return json?.data as {
    posts: Array<unknown>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function fetchFeed(
  page: number = 1,
  limit: number = 20,
  token?: string | null
) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/feed?page=${page}&limit=${limit}`;
  const headers: Record<string, string> = { accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    headers,
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to fetch feed');
  }
  return json?.data as {
    items: Array<unknown>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function fetchGlobalPosts(page: number = 1, limit: number = 20) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/posts?page=${page}&limit=${limit}`;

  const res = await fetch(url, {
    headers: { accept: '*/*' },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to fetch global posts');
  }
  return json?.data as {
    posts: Array<unknown>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function createPost(formData: FormData, token: string) {
  const res = await fetch(
    'https://socialmediaapi-production-fc0e.up.railway.app/api/posts',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*',
      },
      body: formData,
    }
  );

  const json = await res.json();

  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to create post');
  }

  return json;
}

export async function likePost(postId: number, token: string) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/posts/${postId}/like`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    },
    body: '',
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to like post');
  }
  return json?.data as { liked: boolean; likeCount: number };
}

export async function unlikePost(postId: number, token: string) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/posts/${postId}/like`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    },
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to unlike post');
  }
  return json?.data as { liked: boolean; likeCount: number };
}

export async function fetchPostLikes(
  postId: number,
  page: number = 1,
  limit: number = 20,
  token?: string | null
) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/posts/${postId}/likes?page=${page}&limit=${limit}`;
  const headers: Record<string, string> = { accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    headers,
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to fetch post likes');
  }
  return json?.data as {
    users: Array<{
      id: number;
      username: string;
      name: string;
      avatarUrl: string | null;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function fetchPostComments(
  postId: number,
  page: number = 1,
  limit: number = 10
) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/posts/${postId}/comments?page=${page}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { accept: '*/*' },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to fetch comments');
  }
  return json?.data as {
    comments: Array<{
      id: number;
      text: string;
      createdAt: string;
      author: {
        id: number;
        username: string;
        name: string;
        avatarUrl: string | null;
      };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function createPostComment(
  postId: number,
  text: string,
  token: string
) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/posts/${postId}/comments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to create comment');
  }
  return json?.data as {
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
}

export async function deleteComment(commentId: number, token: string) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/comments/${commentId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      accept: '*/*',
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to delete comment');
  }
  return true;
}

export async function followUser(username: string, token: string) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/follow/${encodeURIComponent(
    username
  )}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      accept: '*/*',
      Authorization: `Bearer ${token}`,
    },
    body: '',
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to follow user');
  }
  return json?.data as { following: boolean };
}

export async function unfollowUser(username: string, token: string) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/follow/${encodeURIComponent(
    username
  )}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      accept: '*/*',
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to unfollow user');
  }
  return json?.data as { following: boolean };
}

export async function fetchUserFollowers(
  username: string,
  page: number = 1,
  limit: number = 20,
  token?: string | null
) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/users/${encodeURIComponent(
    username
  )}/followers?page=${page}&limit=${limit}`;
  const headers: Record<string, string> = { accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    headers,
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to fetch followers');
  }
  return json?.data as {
    users: Array<{
      id: number;
      username: string;
      name: string;
      avatarUrl: string | null;
      isFollowedByMe: boolean;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function fetchUserFollowing(
  username: string,
  page: number = 1,
  limit: number = 20,
  token?: string | null
) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/users/${encodeURIComponent(
    username
  )}/following?page=${page}&limit=${limit}`;
  const headers: Record<string, string> = { accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    headers,
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to fetch following');
  }
  return json?.data as {
    users: Array<{
      id: number;
      username: string;
      name: string;
      avatarUrl: string | null;
      isFollowedByMe: boolean;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function fetchMyFollowers(
  page: number = 1,
  limit: number = 20,
  token?: string | null
) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/me/followers?page=${page}&limit=${limit}`;
  const headers: Record<string, string> = { accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers, cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to fetch my followers');
  }
  return json?.data as {
    users: Array<{
      id: number;
      username: string;
      name: string;
      avatarUrl: string | null;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function fetchMyFollowing(
  page: number = 1,
  limit: number = 20,
  token?: string | null
) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/me/following?page=${page}&limit=${limit}`;
  const headers: Record<string, string> = { accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers, cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to fetch my following');
  }
  return json?.data as {
    users: Array<{
      id: number;
      username: string;
      name: string;
      avatarUrl: string | null;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function fetchMe(token: string) {
  const url = 'https://socialmediaapi-production-fc0e.up.railway.app/api/me';
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to fetch profile');
  }
  return json?.data as {
    profile: {
      id: number;
      name: string;
      username: string;
      email: string;
      phone: string | null;
      bio: string | null;
      avatarUrl: string | null;
      createdAt: string;
    };
    stats: {
      posts: number;
      followers: number;
      following: number;
      likes: number;
    };
  };
}

export async function updateMeProfile(form: FormData, token: string) {
  const url = 'https://socialmediaapi-production-fc0e.up.railway.app/api/me';
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
    body: form,
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to update profile');
  }
  return json?.data as unknown;
}

export async function savePost(postId: number, token: string) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/posts/${postId}/save`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      accept: '*/*',
      Authorization: `Bearer ${token}`,
    },
    body: '',
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to save post');
  }
  return json?.data as { saved: boolean };
}

export async function unsavePost(postId: number, token: string) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/posts/${postId}/save`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      accept: '*/*',
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to unsave post');
  }
  return json?.data as { saved: boolean };
}

export async function fetchMySaved(
  page: number = 1,
  limit: number = 20,
  token?: string | null
) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/me/saved?page=${page}&limit=${limit}`;
  const headers: Record<string, string> = { accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers, cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    const msg = json?.message || 'Failed to fetch saved posts';
    throw new Error(`${msg}${!token ? ' (not logged in)' : ''}`);
  }
  return json?.data as {
    posts: Array<unknown>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function deletePost(postId: number, token: string) {
  const url = `https://socialmediaapi-production-fc0e.up.railway.app/api/posts/${postId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      accept: '*/*',
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await res.json();
  if (!res.ok || json?.success !== true) {
    throw new Error(json?.message || 'Failed to delete post');
  }
  return true;
}
