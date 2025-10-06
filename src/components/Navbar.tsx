'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<
    Array<{
      id: number;
      username: string;
      name: string;
      avatarUrl: string | null;
    }>
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const desktopAvatarMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileAvatarMenuRef = useRef<HTMLDivElement | null>(null);
  // Navbar scroll-follow: no need for visibility state when navbar scrolls with page

  useEffect(() => {
    setMounted(true);
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      setIsAuthenticated(true);
      (async () => {
        try {
          const url =
            'https://socialmediaapi-production-fc0e.up.railway.app/api/me';
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              accept: '*/*',
            },
            cache: 'no-store',
          });
          if (res.ok) {
            const json = await res.json();
            const u =
              json?.data?.profile?.username || json?.data?.profile?.name || '';
            const avatarRaw = json?.data?.profile?.avatarUrl || '';
            const avatar = avatarRaw
              ? `${avatarRaw}${
                  avatarRaw.includes('?') ? '&' : '?'
                }v=${Date.now()}`
              : '';
            if (u) {
              setUsername(u);
              localStorage.setItem('username', u);
            }
            if (avatar) {
              setAvatarUrl(avatar);
              localStorage.setItem('avatarUrl', avatar);
            }
          } else {
            // fall back to any cached values
            const storedUsername =
              typeof window !== 'undefined'
                ? localStorage.getItem('username')
                : null;
            const storedAvatar =
              typeof window !== 'undefined'
                ? localStorage.getItem('avatarUrl')
                : null;
            if (storedUsername) setUsername(storedUsername);
            if (storedAvatar) setAvatarUrl(storedAvatar);
          }
        } catch {
          const storedUsername =
            typeof window !== 'undefined'
              ? localStorage.getItem('username')
              : null;
          const storedAvatar =
            typeof window !== 'undefined'
              ? localStorage.getItem('avatarUrl')
              : null;
          if (storedUsername) setUsername(storedUsername);
          if (storedAvatar) setAvatarUrl(storedAvatar);
        }
      })();
    } else {
      setIsAuthenticated(false);
      setUsername('');
      setAvatarUrl('');
    }
  }, []);

  // debounce search
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      try {
        const res = await fetch(
          `https://socialmediaapi-production-fc0e.up.railway.app/api/users/search?q=${encodeURIComponent(
            query
          )}&page=1&limit=20`,
          { headers: { accept: '*/*' }, cache: 'no-store' }
        );
        const json = await res.json();
        if (res.ok && json?.success === true) {
          const users = (json?.data?.users || []) as Array<{
            id: number;
            username: string;
            name: string;
            avatarUrl: string | null;
          }>;
          setResults(users);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // close avatar menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inDesktop = desktopAvatarMenuRef.current?.contains(target) ?? false;
      const inMobile = mobileAvatarMenuRef.current?.contains(target) ?? false;
      if (!inDesktop && !inMobile) setShowAvatarMenu(false);
    };
    if (showAvatarMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAvatarMenu]);

  const handleLogout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('avatarUrl');
        setIsAuthenticated(false);
        setShowAvatarMenu(false);
        window.location.href = '/login';
      }
    } catch {
      // noop
    }
  };

  // Navbar scroll-follow: no special behavior required

  return (
    <>
      {/* Add top padding so content doesn't hide behind fixed navbar */}
      <style jsx global>{`
        body {
          padding-top: 80px;
        }
      `}</style>

      {/* Desktop Navbar */}
      <div className='hidden lg:flex w-[1440px] h-[80px] pl-[40px] pr-[240px] justify-between items-center flex-nowrap bg-[#000] border-y border-[#181D27] fixed top-0 left-0 right-0 z-[200] mx-auto'>
        {/* Logo and brand name section */}
        <div className='flex w-[137px] gap-[11px] items-center shrink-0 flex-nowrap relative z-[118]'>
          <div className='w-[30px] h-[30px] shrink-0 relative overflow-hidden z-[119]'>
            <div className='w-full h-full bg-[url(/images/social-logo.svg)] bg-[length:100%_100%] bg-no-repeat absolute top-0 left-0 z-[120]' />
          </div>
          <span className="h-[36px] shrink-0 basis-auto font-['SF_Pro'] text-[24px] font-bold leading-[36px] text-[#fdfdfd] relative text-left whitespace-nowrap z-[121]">
            Sociality
          </span>
        </div>

        {/* Search bar */}
        <div className='flex w-[491px] h-[48px] pt-[8px] pr-[16px] pb-[8px] pl-[16px] gap-[6px] items-center shrink-0 flex-nowrap bg-[#0a0d12] rounded-full border-solid border border-[#181d27] relative z-[122]'>
          <div className='w-[20px] h-[20px] shrink-0 bg-[url(/images/search-icon.svg)] bg-cover bg-no-repeat relative overflow-hidden z-[123]' />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            onFocus={() => query && setShowResults(true)}
            placeholder='Search'
            className="h-[28px] grow bg-transparent outline-none text-[#fdfdfd] placeholder-[#535861] font-['SF_Pro'] text-[14px]"
          />
          {showResults && results.length > 0 && (
            <div className='absolute top-[52px] left-0 w-full bg-[#0a0d12] border border-[#181d27] rounded-[12px] p-[8px] max-h-[320px] overflow-auto'>
              {results.map((u) => (
                <a
                  key={u.id}
                  href={`/users/${encodeURIComponent(u.username)}`}
                  className='flex items-center gap-[8px] px-[8px] py-[6px] rounded-[8px] hover:bg-[#11151b] cursor-pointer'
                >
                  <div
                    className='w-[28px] h-[28px] rounded-full bg-cover bg-no-repeat'
                    style={{
                      backgroundImage: `url(${
                        u.avatarUrl || '/images/profile-foto.png'
                      })`,
                    }}
                  />
                  <div className='flex flex-col'>
                    <span className="text-[#fdfdfd] text-[14px] font-['SF_Pro'] leading-[18px]">
                      {u.name}
                    </span>
                    <span className="text-[#a4a7ae] text-[12px] font-['SF_Pro'] leading-[14px]">
                      @{u.username}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Login/Register or Profile (auth-aware) */}
        {isAuthenticated ? (
          <div className='relative' ref={desktopAvatarMenuRef}>
            <button
              type='button'
              onClick={() => setShowAvatarMenu((v) => !v)}
              className='flex items-center gap-[12px]'
            >
              <div
                className='w-[40px] h-[40px] bg-cover bg-no-repeat rounded-full'
                style={{
                  backgroundImage: `url(${
                    avatarUrl || '/images/profile-foto.png'
                  })`,
                }}
              />
              <span className="h-[30px] shrink-0 basis-auto font-['SF_Pro'] text-[16px] font-bold leading-[30px] text-[#fdfdfd] tracking-[-0.32px]">
                {username || 'User'}
              </span>
            </button>
            {showAvatarMenu && (
              <div className='absolute right-0 mt-[8px] w-[180px] rounded-[12px] border border-[#181d27] bg-[#0a0d12] shadow-xl z-[210]'>
                <Link
                  href='/users/profile'
                  className='block px-[12px] py-[10px] text-left text-[#fdfdfd] hover:bg-[#11151b] rounded-t-[12px]'
                  onClick={() => setShowAvatarMenu(false)}
                >
                  Profile
                </Link>
                <button
                  type='button'
                  className='w-full px-[12px] py-[10px] text-left text-[#fdfdfd] hover:bg-[#11151b] rounded-b-[12px]'
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className='flex w-[272px] gap-[12px] items-center shrink-0 flex-nowrap relative z-[125]'>
            <Link href='/login'>
              <div className='flex w-[130px] h-[44px] pt-[8px] pr-[8px] pb-[8px] pl-[8px] gap-[8px] justify-center items-center shrink-0 flex-nowrap rounded-[100px] border-solid border border-[#181d27] relative z-[126] cursor-pointer'>
                <span className="h-[30px] shrink-0 basis-auto font-['SF_Pro'] text-[16px] font-bold leading-[30px] text-[#fdfdfd] tracking-[-0.32px]">
                  Login
                </span>
              </div>
            </Link>
            <Link href='/register'>
              <div className='flex w-[130px] h-[44px] pt-[8px] pr-[8px] pb-[8px] pl-[8px] gap-[8px] justify-center items-center shrink-0 flex-nowrap bg-[#6936f2] rounded-[100px] relative z-[128] cursor-pointer'>
                <span className="h-[30px] shrink-0 basis-auto font-['SF_Pro'] text-[16px] font-bold leading-[30px] text-[#fdfdfd] tracking-[-0.32px]">
                  Register
                </span>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Navbar - background shim to avoid white edges at ~450px */}
      <div className='lg:hidden fixed top-0 left-0 right-0 h-[80px] bg-[#000] border-b border-[#181D27] z-[199]' />

      {/* Mobile Navbar - visible only on small screens */}
      <div className='lg:hidden w-full max-w-[393px] h-[80px] px-[16px] flex justify-between items-center bg-[#000] border-y border-[#181D27] fixed top-0 left-0 right-0 z-[200] mx-auto overflow-visible'>
        {/* Left: Logo + Sociality/Edit Profile/Add Post */}
        <div className='flex gap-[8px] items-center'>
          {!mounted ? (
            <>
              <div className='w-[30px] h-[30px] shrink-0 relative overflow-hidden'>
                <div className='w-full h-full bg-[url(/images/social-logo.svg)] bg-[length:100%_100%] bg-no-repeat' />
              </div>
              <span className="font-['SF_Pro'] text-[24px] font-bold text-[#fdfdfd]">
                Sociality
              </span>
            </>
          ) : typeof window !== 'undefined' &&
            window.location.pathname.includes('/edit') ? (
            <Link
              href='/users/profile'
              className='flex gap-[8px] items-center hover:opacity-80 transition-opacity'
            >
              <div className='w-[30px] h-[30px] shrink-0 relative overflow-hidden'>
                <div className='w-full h-full bg-[url(/images/arrow.svg)] bg-[length:100%_100%] bg-no-repeat' />
              </div>
              <span className="font-['SF_Pro'] text-[24px] font-bold text-[#fdfdfd]">
                Edit Profile
              </span>
            </Link>
          ) : typeof window !== 'undefined' &&
            window.location.pathname.includes('/posts/new') ? (
            <Link
              href='/'
              className='flex gap-[8px] items-center hover:opacity-80 transition-opacity'
            >
              <div className='w-[30px] h-[30px] shrink-0 relative overflow-hidden'>
                <div className='w-full h-full bg-[url(/images/arrow.svg)] bg-[length:100%_100%] bg-no-repeat' />
              </div>
              <span className="font-['SF_Pro'] text-[24px] font-bold text-[#fdfdfd]">
                Add Post
              </span>
            </Link>
          ) : (
            <>
              <div className='w-[30px] h-[30px] shrink-0 relative overflow-hidden'>
                <div className='w-full h-full bg-[url(/images/social-logo.svg)] bg-[length:100%_100%] bg-no-repeat' />
              </div>
              <span className="font-['SF_Pro'] text-[24px] font-bold text-[#fdfdfd]">
                Sociality
              </span>
            </>
          )}
        </div>

        {/* Right: Search + Auth-aware avatar/name or hamburger */}
        <div className='flex gap-[16px] items-center'>
          <div className='flex w-[120px] h-[48px] pt-[8px] pr-[12px] pb-[8px] pl-[12px] gap-[6px] items-center shrink-0 flex-nowrap bg-[#0a0d12] rounded-full border border-[#181d27] relative z-[1]'>
            <div className='absolute left-[12px] w-[20px] h-[20px] bg-[url(/images/search-icon.svg)] bg-cover bg-no-repeat pointer-events-none' />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onBlur={() => setTimeout(() => setShowResults(false), 150)}
              onFocus={() => query && setShowResults(true)}
              placeholder='Search'
              className="h-[28px] grow bg-transparent outline-none text-[#fdfdfd] placeholder-[#535861] font-['SF_Pro'] text-[14px] pl-[28px]"
            />
            {showResults && results.length > 0 && (
              <div className='absolute top-[52px] left-0 w-full bg-[#0a0d12] border border-[#181d27] rounded-[12px] p-[8px] max-h-[50vh] overflow-auto'>
                {results.map((u) => (
                  <a
                    key={u.id}
                    href={`/users/${encodeURIComponent(u.username)}`}
                    className='flex items-center gap-[8px] px-[8px] py-[6px] rounded-[8px] hover:bg-[#11151b] cursor-pointer'
                  >
                    <div
                      className='w-[28px] h-[28px] rounded-full bg-cover bg-no-repeat'
                      style={{
                        backgroundImage: `url(${
                          u.avatarUrl || '/images/profile-foto.png'
                        })`,
                      }}
                    />
                    <div className='flex flex-col'>
                      <span className="text-[#fdfdfd] text-[14px] font-['SF_Pro'] leading-[18px]">
                        {u.name}
                      </span>
                      <span className="text-[#a4a7ae] text-[12px] font-['SF_Pro'] leading-[14px]">
                        @{u.username}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
          {isAuthenticated ? (
            <div className='relative' ref={mobileAvatarMenuRef}>
              <button
                type='button'
                onClick={() => setShowAvatarMenu((v) => !v)}
                className='w-[32px] h-[32px] bg-cover bg-no-repeat rounded-full shrink-0 relative z-[10]'
                style={{
                  backgroundImage: `url(${
                    avatarUrl || '/images/profile-foto.png'
                  })`,
                }}
              />
              {showAvatarMenu && (
                <div className='absolute right-0 mt-[8px] w-[160px] rounded-[12px] border border-[#181d27] bg-[#0a0d12] shadow-xl z-[220]'>
                  <Link
                    href='/users/profile'
                    className='block px-[12px] py-[10px] text-left text-[#fdfdfd] hover:bg-[#11151b] rounded-t-[12px]'
                    onClick={() => setShowAvatarMenu(false)}
                  >
                    Profile
                  </Link>
                  <button
                    type='button'
                    className='w-full px-[12px] py-[10px] text-left text-[#fdfdfd] hover:bg-[#11151b] rounded-b-[12px]'
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {!isMenuOpen ? (
                <button
                  type='button'
                  aria-label='Open menu'
                  className='w-[18px] h-[14px] shrink-0 bg-[url(/images/hamburger-Icon.png)] bg-cover bg-no-repeat cursor-pointer relative z-[205]'
                  onClick={() => setIsMenuOpen(true)}
                />
              ) : (
                <button
                  type='button'
                  aria-label='Close menu'
                  className='w-[32px] h-[32px] shrink-0 text-white text-[32px] font-normal flex items-center justify-center cursor-pointer relative z-[205]'
                  onClick={() => setIsMenuOpen(false)}
                >
                  ×
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu - shown when hamburger is clicked */}
      {isMenuOpen && !isAuthenticated && (
        <div className='lg:hidden w-full max-w-[393px] px-[16px] py-[12px] flex flex-col gap-[16px] justify-center bg-[#000] border-b border-[#181D27] absolute top-[80px] left-0 right-0 z-[120]'>
          {/* Login/Register buttons */}
          <div className='flex gap-[16px] justify-center'>
            <Link href='/login' onClick={() => setIsMenuOpen(false)}>
              <div className='flex w-[174px] h-[40px] justify-center items-center rounded-full border border-[#181d27] cursor-pointer'>
                <span className="font-['SF_Pro'] text-[16px] font-bold text-[#fdfdfd]">
                  Login
                </span>
              </div>
            </Link>
            <Link href='/register' onClick={() => setIsMenuOpen(false)}>
              <div className='flex w-[174px] h-[40px] justify-center items-center bg-[#6936f2] rounded-full cursor-pointer'>
                <span className="font-['SF_Pro'] text-[16px] font-bold text-[#fdfdfd]">
                  Register
                </span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
