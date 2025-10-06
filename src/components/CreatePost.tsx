'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from '@/lib/api';
import { toast } from 'sonner';

export default function CreatePost() {
  const [mounted, setMounted] = useState(false);
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => setMounted(true), []);

  const token = mounted ? localStorage.getItem('token') : null;

  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!token) throw new Error('Not authenticated');
      return createPost(formData, token);
    },
    onSuccess: () => {
      toast.success('Post created successfully!');
      setCaption('');
      setImage(null);
      // Reset file input
      const fileInput = document.getElementById(
        'image-input'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      // Invalidate queries to refresh feed
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['globalPosts'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create post');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please login to create a post');
      return;
    }

    if (!caption.trim() && !image) {
      toast.error('Please add a caption or image');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('caption', caption.trim());
    if (image) {
      formData.append('image', image);
    }

    try {
      await createPostMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setImage(file);
    }
  };

  if (!mounted) return null; // Render null on server and until client mounts

  if (!token) {
    return (
      <div className='text-[#a4a7ae] font-sfpro text-sm px-[16px] lg:px-0'>
        Please login to create posts
      </div>
    );
  }

  return (
    <div className='flex w-full max-w-[600px] flex-col gap-[16px] items-start relative mx-auto px-[16px] lg:px-0 mb-[24px]'>
      <div className='flex w-full flex-col gap-[12px] items-start self-stretch p-[16px] bg-[#0a0d12] border border-[#181d27] rounded-[12px]'>
        <form
          onSubmit={handleSubmit}
          className='w-full flex flex-col gap-[12px]'
        >
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's on your mind?"
            className='w-full min-h-[80px] p-[12px] bg-transparent border border-[#181d27] rounded-[8px] text-[#fdfdfd] placeholder-[#535861] font-["SF_Pro"] text-[14px] resize-none outline-none focus:border-[#7e51f8]'
            maxLength={500}
          />

          <div className='flex items-center gap-[12px]'>
            <label className='flex items-center gap-[8px] px-[12px] py-[6px] bg-[#181d27] rounded-[8px] cursor-pointer hover:bg-[#22252d] transition-colors'>
              <div className='w-[16px] h-[16px] bg-[url(/images/plus-icon.svg)] bg-cover bg-no-repeat' />
              <span className='text-[#fdfdfd] font-["SF_Pro"] text-[12px]'>
                Add Image
              </span>
              <input
                id='image-input'
                type='file'
                accept='image/*'
                onChange={handleImageChange}
                className='hidden'
              />
            </label>

            {image && (
              <div className='flex items-center gap-[8px] text-[#a4a7ae] font-["SF_Pro"] text-[12px]'>
                <span>Selected: {image.name}</span>
                <button
                  type='button'
                  onClick={() => setImage(null)}
                  className='text-red-400 hover:text-red-300'
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className='flex justify-between items-center'>
            <span className='text-[#535861] font-["SF_Pro"] text-[12px]'>
              {caption.length}/500
            </span>
            <button
              type='submit'
              disabled={isSubmitting || (!caption.trim() && !image)}
              className='px-[16px] py-[8px] bg-[#7e51f8] text-[#fdfdfd] font-["SF_Pro"] text-[14px] font-medium rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#6b46e6] transition-colors'
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
