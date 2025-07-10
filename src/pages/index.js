import { useEffect, useState } from 'react';
import AppCard from './components/appCard';
import EngToolkitToolbar from './components/engToolkitToolbar';
import Footer from './components/footer';
import Navbar from './components/nav';

export default function Home() {
  return (
    <>
      <div className='min-h-screen bg-zinc-900 pt-14'>
        <Navbar />
        <div className='flex flex-col items-center justify-center align-middle px-4'>
          <div className='max-w-6xl w-full'>
            <EngToolkitToolbar />
            <AppCard />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
