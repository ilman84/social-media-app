import Navbar from '../components/Navbar';
import Feed from '../components/Feed';
import Link from 'next/link';

export default function Home() {
  return (
    <div className='main-container w-full max-w-[1440px] min-h-screen relative mx-auto my-0 flex justify-center'>
      {/* Inner content container */}
      <div className='w-full max-w-[1440px] min-h-screen bg-[#000] relative pb-[96px]'>
        <Navbar />

        <div className='mt-[16px]'>
          <Feed />
        </div>
        {/* Bottom navigation - fixed at bottom, responsive mobile and desktop */}
        <div className='flex w:[320px] w-[320px] lg:w-[360px] h-[60px] lg:h-[80px] gap-[30px] lg:gap-[45px] justify-center items-center flex-nowrap bg-[#0a0d12] rounded-[1000px] border-solid border border-[#181d27] fixed bottom-2 left-0 right-0 mx-auto z-[200]'>
          <div className='flex w-[94px] flex-col gap-[4px] justify-center items-center shrink-0 flex-nowrap relative z-[131]'>
            <div className='w-[24px] h-[24px] shrink-0 relative z-[132]'>
              <div className='w-[24px] h-[24px] bg-[url(/images/home-icon.svg)] bg-cover bg-no-repeat absolute top-0 left-0 z-[133]' />
            </div>
            <span className="h-[30px] self-stretch shrink-0 basis-auto font-['SF_Pro'] text-[16px] font-bold leading-[30px] text-[#7e51f8] tracking-[-0.32px] relative text-center overflow-hidden whitespace-nowrap z-[134]">
              Home
            </span>
          </div>
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
            <span className="h-[30px] self-stretch shrink-0 basis-auto font-['SF_Pro'] text-[16px] font-normal leading-[30px] text-[#fdfdfd] tracking-[-0.32px] relative text-center overflow-hidden whitespace-nowrap z-[140]">
              Profile
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
