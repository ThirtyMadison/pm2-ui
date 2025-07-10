import AppCard from './components/appCard';
import Footer from './components/footer';
import Navbar from './components/nav';

export default function Home() {
  return (
    <>
      <div className='min-h-screen bg-zinc-900 pt-14'>
        <Navbar />
        <div className='flex flex-col items-center justify-center align-middle'>
          <AppCard />
        </div>
      </div>
      <Footer />
    </>
  );
}
