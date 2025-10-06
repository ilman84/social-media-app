'use client';

import { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import { fetchMe, updateMeProfile } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

export default function EditProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setToken(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!token) return;
        setLoading(true);
        const data = await fetchMe(token);
        const p = data.profile;
        setName(p.name || '');
        setUsername(p.username || '');
        setEmail(p.email || '');
        setPhone(p.phone || '');
        setBio(p.bio || '');
        setAvatarUrl(p.avatarUrl);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load profile';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const onPickFile = () => fileInputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) return;
    if (f.size > 5 * 1024 * 1024) return;
    setAvatarFile(f);
    setAvatarUrl(URL.createObjectURL(f));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const form = new FormData();
    if (name) form.append('name', name);
    if (username) form.append('username', username);
    if (email) form.append('email', email);
    if (phone) form.append('phone', phone);
    if (bio) form.append('bio', bio);
    if (avatarFile) form.append('avatar', avatarFile);
    try {
      setLoading(true);
      await updateMeProfile(form, token);
      // update local storage username/avatar if changed
      if (username) localStorage.setItem('username', username);
      if (avatarUrl) localStorage.setItem('avatarUrl', avatarUrl);
      toast.success('Profile Success Update');
      router.replace(`/users/${encodeURIComponent(username || '')}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update profile';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full max-w-[1440px] min-h-screen bg-[#000] mx-auto'>
      <Navbar />
      <form
        onSubmit={onSubmit}
        className='main-container flex w-full max-w-[800px] flex-col gap-[32px] items-start relative mx-auto my-0 px-[16px] lg:px-0 pb-[100px]'
      >
        {/* Header - hidden on mobile, shown on desktop */}
        <Link
          href='/users/profile'
          className='hidden lg:flex w-[165px] gap-[12px] items-center pt-10 hover:opacity-80 transition-opacity'
        >
          <div className='w-[32px] h-[32px] shrink-0 bg-[url(/images/arrow.svg)] bg-cover bg-no-repeat' />
          <span className="h-[36px] font-['SF_Pro'] text-[24px] font-bold leading-[36px] text-[#fdfdfd] whitespace-nowrap">
            Edit Profile
          </span>
        </Link>

        {/* Mobile Layout */}
        <div className='flex lg:hidden flex-col gap-[24px] items-center w-full pt-[24px]'>
          {/* Avatar + Change Photo */}
          <div className='flex flex-col gap-[16px] items-center'>
            <div
              className='w-[120px] h-[120px] rounded-full bg-cover bg-no-repeat'
              style={{
                backgroundImage: `url(${
                  avatarUrl || '/images/profile-foto.png'
                })`,
              }}
            />
            <Button
              type='button'
              variant='outline'
              onClick={onPickFile}
              className='w-[160px] h-[48px] rounded-[100px] border-[#ffffff] text-[#ffffff] bg-black'
            >
              Change Photo
            </Button>
            <input
              ref={fileInputRef}
              className='hidden'
              type='file'
              accept='image/*'
              onChange={onFileChange}
            />
          </div>

          {/* Mobile Form Fields */}
          <div className='flex flex-col gap-[20px] items-stretch w-full px-[16px]'>
            {/* Name */}
            <div className='flex flex-col gap-[2px] items-stretch'>
              <span className="w-full font-['SF_Pro'] text-[14px] font-bold leading-[28px] text-[#fff]">
                Name
              </span>
              <div className='flex h-[48px] items-center bg-[#0a0d12] rounded-[12px] border border-[#181d27] px-[16px]'>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='h-[30px] bg-transparent border-0 p-0 text-[#fdfdfd] font-[590] focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>
            </div>

            {/* Username */}
            <div className='flex flex-col gap-[2px] items-stretch'>
              <span className="w-full font-['SF_Pro'] text-[14px] font-bold leading-[28px] text-[#fff]">
                Username
              </span>
              <div className='flex h-[48px] items-center bg-[#0a0d12] rounded-[12px] border border-[#181d27] px-[16px]'>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className='h-[30px] bg-transparent border-0 p-0 text-[#fdfdfd] font-[590] focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>
            </div>

            {/* Email */}
            <div className='flex flex-col gap-[2px] items-stretch'>
              <span className="w-full font-['SF_Pro'] text-[14px] font-bold leading-[28px] text-[#fff]">
                Email
              </span>
              <div className='flex h-[48px] items-center bg-[#0a0d12] rounded-[12px] border border-[#181d27] px-[16px]'>
                <Input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='h-[30px] bg-transparent border-0 p-0 text-[#fdfdfd] font-[590] focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>
            </div>

            {/* Number Phone */}
            <div className='flex flex-col gap-[2px] items-stretch'>
              <span className="w-full font-['SF_Pro'] text-[14px] font-bold leading-[28px] text-[#fff]">
                Number Phone
              </span>
              <div className='flex h-[48px] items-center bg-[#0a0d12] rounded-[12px] border border-[#181d27] px-[16px]'>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className='h-[30px] bg-transparent border-0 p-0 text-[#fdfdfd] font-[590] focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>
            </div>

            {/* Bio */}
            <div className='flex flex-col gap-[2px] items-stretch'>
              <span className="w-full font-['SF_Pro'] text-[14px] font-bold leading-[28px] text-[#fdfdfd]">
                Bio
              </span>
              <div className='flex h-[101px] items-start bg-[#0a0d12] rounded-[12px] border border-[#181d27] px-[16px] py-[8px]'>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className='w-full h-[60px] bg-transparent outline-none border-0 text-[#fdfdfd] text-[16px] leading-[30px]'
                />
              </div>
            </div>

            {/* Save Button */}
            <Button
              type='submit'
              disabled={loading || !token}
              className='flex h-[48px] px-[8px] justify-center items-center w-full bg-[#6936f2] rounded-[100px] text-[#fdfdfd] text-[16px] font-bold mt-[8px]'
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className='hidden lg:flex gap-[48px] items-start self-stretch'>
          {/* Left avatar + change photo */}
          <div className='flex w-[160px] flex-col gap-[16px] items-center'>
            <div
              className='w-[130px] h-[130px] rounded-full bg-cover bg-no-repeat'
              style={{
                backgroundImage: `url(${
                  avatarUrl || '/images/profile-foto.png'
                })`,
              }}
            />
            <Button
              type='button'
              variant='outline'
              onClick={onPickFile}
              className='w-[160px] h-[48px] rounded-[100px] border-[#ffffff] text-[#ffffff] bg-black'
            >
              Change Photo
            </Button>
            <input
              ref={fileInputRef}
              className='hidden'
              type='file'
              accept='image/*'
              onChange={onFileChange}
            />
          </div>

          {/* Right form fields */}
          <div className='flex flex-col gap-[24px] items-start grow'>
            {/* Name */}
            <div className='flex flex-col gap-[2px] items-stretch self-stretch'>
              <span className="w-full font-['SF_Pro'] text-[14px] font-bold leading-[28px] text-[#fff]">
                Name
              </span>
              <div className='flex h-[48px] items-center bg-[#0a0d12] rounded-[12px] border border-[#181d27] px-[16px]'>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='h-[30px] bg-transparent border-0 p-0 text-[#fdfdfd] font-[590] focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>
            </div>

            {/* Username */}
            <div className='flex flex-col gap-[2px] items-stretch self-stretch'>
              <span className="w-full font-['SF_Pro'] text-[14px] font-bold leading-[28px] text-[#fff]">
                Username
              </span>
              <div className='flex h-[48px] items-center bg-[#0a0d12] rounded-[12px] border border-[#181d27] px-[16px]'>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className='h-[30px] bg-transparent border-0 p-0 text-[#fdfdfd] font-[590] focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>
            </div>

            {/* Email */}
            <div className='flex flex-col gap-[2px] items-stretch self-stretch'>
              <span className="w-full font-['SF_Pro'] text-[14px] font-bold leading-[28px] text-[#fff]">
                Email
              </span>
              <div className='flex h-[48px] items-center bg-[#0a0d12] rounded-[12px] border border-[#181d27] px-[16px]'>
                <Input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='h-[30px] bg-transparent border-0 p-0 text-[#fdfdfd] font-[590] focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>
            </div>

            {/* Number Phone */}
            <div className='flex flex-col gap-[2px] items-stretch self-stretch'>
              <span className="w-full font-['SF_Pro'] text-[14px] font-bold leading-[28px] text-[#fff]">
                Number Phone
              </span>
              <div className='flex h-[48px] items-center bg-[#0a0d12] rounded-[12px] border border-[#181d27] px-[16px]'>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className='h-[30px] bg-transparent border-0 p-0 text-[#fdfdfd] font-[590] focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>
            </div>

            {/* Bio */}
            <div className='flex flex-col gap-[2px] items-stretch self-stretch'>
              <span className="w-full font-['SF_Pro'] text-[14px] font-bold leading-[28px] text-[#fdfdfd]">
                Bio
              </span>
              <div className='flex h-[101px] items-start bg-[#0a0d12] rounded-[12px] border border-[#181d27] px-[16px] py-[8px]'>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className='w-full h-[60px] bg-transparent outline-none border-0 text-[#fdfdfd] text-[16px] leading-[30px]'
                />
              </div>
            </div>

            {/* Save */}
            <Button
              type='submit'
              disabled={loading || !token}
              className='flex h-[48px] px-[8px] justify-center items-center self-stretch bg-[#6936f2] rounded-[100px] text-[#fdfdfd] text-[16px] font-bold'
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
