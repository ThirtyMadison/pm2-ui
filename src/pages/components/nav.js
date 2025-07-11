import {
  faToolbox
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { Logo } from './logo';

const Navbar = ({ onEngToolkitToolbarToggle, isEngToolkitToolbarEnabled }) => {
  return (
    <div className='px-3 w-full z-[100] fixed top-0 bg-black/80 backdrop-blur-sm h-[55px] items-center align-middle flex select-none cursor-default'>
      <div className='w-full max-w-7xl mx-auto justify-between flex'>
        <Link href={'/'}>
          <Logo />
        </Link>

        <div className='flex gap-2'>
          <a 
            href={'http://admin.tm.localhost:3000/'} 
            target="_blank" 
            rel="noopener noreferrer"
            className='p-1 px-3 flex h-min items-center font-medium text-white rounded-md bg-gradient-to-r from-zinc-600 to-zinc-700 hover:bg-blue-300'
          >
            Admin
          </a>

          <button
            className='p-1 px-3 flex h-min items-center font-medium text-white rounded-md bg-gradient-to-r from-zinc-600 to-zinc-700 hover:bg-blue-300'
            onClick={() => {
              if (!isEngToolkitToolbarEnabled) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }

              onEngToolkitToolbarToggle(!isEngToolkitToolbarEnabled)}}
          >
            <FontAwesomeIcon
              icon={faToolbox}
              className='pr-2 hidden md:inline-block'
            />
            Eng Toolkit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
