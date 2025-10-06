'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Login() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div
      className='main-container w-full max-w-[1440px] h-[852px] lg:h-[1024px] relative mx-auto my-0 flex justify-center items-center'
      style={{ overflow: 'hidden' }}
    >
      <div className='w-full max-w-[1440px] h-[852px] lg:h-[1024px] bg-[#000] relative'>
        <div className='flex w-[345px] h-[450px] lg:w-[446px] lg:h-auto pt-[20px] lg:pt-[40px] pr-[24px] pb-[40px] pl-[24px] flex-col gap-[16px] lg:gap-[24px] items-center flex-nowrap bg-[rgba(0,0,0,0.2)] rounded-[16px] border-solid border border-[#181d27] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[2] font-sfpro'>
          <div className='flex w-[137px] gap-[11px] items-center shrink-0 flex-nowrap relative z-[3]'>
            <div className='w-[30px] h-[30px] shrink-0 relative overflow-hidden z-[4]'>
              <div className='w-full h-full bg-[url(/images/social-logo.svg)] bg-[length:100%_100%] bg-no-repeat absolute top-0 left-0 z-[5]' />
            </div>
            <span className="h-[36px] shrink-0 basis-auto font-['SF_Pro'] text-[20px] lg:text-[24px] font-bold leading-[36px] text-[#fdfdfd] relative text-left whitespace-nowrap z-[6]">
              Sociality
            </span>
          </div>
          <span className="flex w-[172px] h-[36px] justify-center items-start shrink-0 basis-auto font-['SF_Pro'] text-[20px] lg:text-[24px] font-bold leading-[36px] text-[#fdfdfd] relative text-center whitespace-nowrap z-[7]">
            Welcome Back!
          </span>
          <form
            className='flex flex-col gap-[20px] items-start self-stretch shrink-0 flex-nowrap relative z-[8]'
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const data = new FormData(form);
              const email = String(data.get('email') || '');
              const password = String(data.get('password') || '');
              if (!email || !password) {
                toast.error('Please fill email and password.');
                return;
              }
              try {
                setSubmitting(true);
                const res = await fetch(
                  'https://socialmediaapi-production-fc0e.up.railway.app/api/auth/login',
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      accept: '*/*',
                    },
                    body: JSON.stringify({ email, password }),
                  }
                );
                const json = await res.json();
                if (!res.ok || json?.success !== true) {
                  throw new Error(json?.message || 'Login failed');
                }
                const token = json?.data?.token as string | undefined;
                if (token) localStorage.setItem('token', token);
                const uname =
                  json?.data?.profile?.username ||
                  json?.data?.user?.username ||
                  json?.data?.username ||
                  json?.user?.username ||
                  json?.username ||
                  '';
                if (uname) localStorage.setItem('username', uname);
                sessionStorage.setItem('flash', 'login-success');
                router.push('/');
              } catch (err: unknown) {
                const message =
                  err instanceof Error ? err.message : 'Login failed';
                toast.error(message);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className='flex flex-col gap-[2px] items-start self-stretch shrink-0 flex-nowrap relative z-[9]'>
              <Label className='h-[28px] self-stretch text-white font-sfpro'>
                Email
              </Label>
              <Input
                name='email'
                placeholder='Enter your email'
                className='text-white placeholder-[#535861]'
              />
            </div>
            <div className='flex flex-col gap-[2px] items-start self-stretch shrink-0 flex-nowrap relative z-[13]'>
              <Label className='h-[28px] self-stretch text-white font-sfpro'>
                Password
              </Label>
              <div className='w-full relative'>
                <Input
                  name='password'
                  placeholder='Enter your password'
                  type={showPassword ? 'text' : 'password'}
                  className='pr-[44px] text-white placeholder-[#535861]'
                />
                <button
                  type='button'
                  className='absolute right-[12px] top-1/2 -translate-y-1/2 z-[17] w-[24px] h-[24px] flex items-center justify-center'
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label='Toggle password visibility'
                >
                  {showPassword ? (
                    <svg
                      width='20'
                      height='20'
                      viewBox='0 0 24 24'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        d='M3 3l18 18'
                        stroke='white'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                      <path
                        d='M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-3.42M21 12s-3.5-6-9-6-9 6-9 6 3.5 6 9 6c2.03 0 3.83-.74 5.33-1.82'
                        stroke='white'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  ) : (
                    <svg
                      width='20'
                      height='20'
                      viewBox='0 0 24 24'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        d='M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z'
                        stroke='white'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                      <circle
                        cx='12'
                        cy='12'
                        r='3'
                        stroke='white'
                        strokeWidth='2'
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className='flex flex-col gap-[16px] items-center self-stretch shrink-0 flex-nowrap relative z-[18]'>
              <Button
                type='submit'
                disabled={submitting}
                className='h-[48px] self-stretch bg-[#6936F2] text-white hover:bg-[#5f30da] rounded-[100px]'
              >
                Login
              </Button>
              <div className='flex w-[247px] gap-[4px] justify-center items-center shrink-0 flex-nowrap relative z-[21]'>
                <span className="h-[30px] shrink-0 basis-auto font-['SF_Pro'] text-[14px] lg:text-[16px] font-[590] leading-[30px] text-[#fdfdfd] tracking-[-0.32px] relative text-left whitespace-nowrap z-[22]">
                  Don&#39;t have an account?
                </span>
                <Link href='/register'>
                  <span className="h-[30px] shrink-0 basis-auto font-['SF_Pro'] text-[14px] lg:text-[16px] font-bold leading-[30px] text-[#7e51f8] tracking-[-0.32px] relative text-left whitespace-nowrap z-[23] cursor-pointer">
                    Register
                  </span>
                </Link>
              </div>
            </div>
          </form>
        </div>
        <div className='w-[414.556px] lg:w-[1920px] h-[233.188px] lg:h-[1080px] bg-[url(/images/gradient-mobile.svg)] lg:bg-[gradient-desktop.svg)] bg-cover bg-no-repeat lg:rounded-[120px] absolute top-[619px] lg:top-[150px] left-1/2 lg:left-[-404px] translate-x-[-50.05%] lg:translate-x-0 overflow-hidden z-[1]' />
      </div>
    </div>
  );
}
