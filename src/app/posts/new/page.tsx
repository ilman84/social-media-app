'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from '@/lib/api';
import Image from 'next/image';
import { Toaster, toast } from 'sonner';

import Navbar from '@/components/Navbar';

export default function AddPostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [caption, setCaption] = useState('');

  useEffect(() => setMounted(true), []);
  const token = mounted ? localStorage.getItem('token') : null;

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!token) throw new Error('Please login');
      return createPost(formData, token);
    },
    onSuccess: async () => {
      toast.success('Your post has been shared');
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['globalPosts'] });
      router.push('/');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to share post');
    },
  });

  const onFileSelect = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB
    setImage(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    onFileSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!image && !caption.trim()) return;
    const form = new FormData();
    if (image) form.append('image', image);
    form.append('caption', caption.trim());
    await mutation.mutateAsync(form);
  };

  if (!mounted) return null;

  return (
    <div className='w-full min-h-screen bg-[#000]'>
      <Toaster richColors closeButton position='top-center' />
      <div className='w-full max-w-[1440px] mx-auto'>
        <Navbar />
      </div>
      <div className='w-full max-w-[720px] mx-auto px-[16px] py-[16px]'>
        <div className='hidden lg:flex items-center gap-[12px] mb-[8px]'>
          <button
            onClick={() => router.back()}
            className='text-[#fdfdfd] text-[16px] sm:text-[24px] font-[600]'
          >
            ←
          </button>
          <h1 className="font-['SF_Pro'] text-[16px] sm:text-[24px] font-bold text-[#fdfdfd]">
            Add Post
          </h1>
        </div>
        {/* Photo label: mobile (<=393px) under navbar */}
        <div className='show-at-393 mb-[12px]'>
          <span className="font-['SF_Pro'] text-[16px] font-bold text-[#fdfdfd]">
            Photo
          </span>
        </div>
        {/* Photo label: desktop under Add Post header */}
        <div className='hidden lg:block mb-[16px]'>
          <span className="font-['SF_Pro'] text-[16px] font-bold text-[#fdfdfd]">
            Photo
          </span>
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col gap-[16px]'>
          <div
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={handleDrop}
            className='w-full min-h-[180px] rounded-[12px] border border-[#181d27] bg-[#0a0d12] flex flex-col items-center justify-center gap-[8px]'
          >
            {image ? (
              <div className='flex flex-col items-center gap-[8px] p-[12px]'>
                <Image
                  src={URL.createObjectURL(image)}
                  alt='preview'
                  width={600}
                  height={400}
                  className='max-h-[240px] rounded-[8px] object-contain w-auto h-auto'
                  unoptimized
                />
                <button
                  type='button'
                  onClick={() => setImage(null)}
                  className='text-[#a4a7ae] hover:text-[#fdfdfd] text-[12px]'
                >
                  Remove image
                </button>
              </div>
            ) : (
              <label className='w-full h-full flex flex-col items-center justify-center gap-[8px] cursor-pointer'>
                <div className='w-[36px] h-[36px] rounded-full border border-[#2a2f39] flex items-center justify-center'>
                  <div className='w-[18px] h-[18px] bg-[url(/images/plus-icon.svg)] bg-cover bg-no-repeat' />
                </div>
                <span className="text-[#7e84a3] text-[12px] font-['SF_Pro']">
                  Click to upload or drag and drop
                </span>
                <span className="text-[#7e84a3] text-[12px] font-['SF_Pro']">
                  PNG or JPG (max. 5mb)
                </span>
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={(e) => onFileSelect(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div className='flex flex-col gap-[8px]'>
            <label className="text-[#ffffff] text-[16px] font-bold font-['SF_Pro']">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder='Create your caption'
              className='w-full min-h-[120px] p-[12px] bg-[#0a0d12] border border-[#181d27] rounded-[12px] text-[#fdfdfd] placeholder-[#535861] outline-none'
              maxLength={500}
            />
          </div>

          <button
            type='submit'
            disabled={mutation.isPending || (!image && !caption.trim())}
            className='w-full h-[44px] rounded-[24px] bg-[#6936F2] text-[#fdfdfd] text-[14px] font-[600] disabled:opacity-100 disabled:cursor-not-allowed hover:bg-[#5c2fe0] transition-colors'
          >
            {mutation.isPending ? 'Sharing...' : 'Share'}
          </button>
        </form>
      </div>
    </div>
  );
}
