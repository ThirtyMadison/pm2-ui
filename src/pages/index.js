import { useState } from 'react';
import AppCard from '@/pages/components/appCard';
import EngToolkitToolbar from '@/pages/components/engToolkit/engToolkitToolbar';
import Navbar from '@/pages/components/nav';

export default function Home() {
  const [isEngToolkitToolbarEnabled, setIsEngToolkitToolbarEnabled] = useState(false);

  return (
    <>
      <div className='min-h-screen bg-zinc-900 pt-14'>
        <Navbar onEngToolkitToolbarToggle={setIsEngToolkitToolbarEnabled} isEngToolkitToolbarEnabled={isEngToolkitToolbarEnabled} />

        <div className='flex flex-col items-center justify-center align-middle px-4'>
          <div className='max-w-7xl w-full'>
            {isEngToolkitToolbarEnabled && <EngToolkitToolbar />}


            <div className='mt-6'>
              <AppCard />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
