import AppCard from './components/appCard';
import EngToolkitToolbar from './components/engToolkitToolbar';
import Navbar from './components/nav';

export default function Home() {
  return (
    <>
      <div className='min-h-screen bg-zinc-900 pt-14'>
        <Navbar />

        <div className='flex flex-col items-center justify-center align-middle px-4'>
          <div className='max-w-7xl w-full'>
            <EngToolkitToolbar />
            <AppCard />
          </div>
        </div>
      </div>
    </>
  );
}
