import {
  faBookBookmark,
  faHeartPulse
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

const Navbar = () => {
  return (
    <div className='px-3 w-full z-[100] fixed top-0 bg-black/80 backdrop-blur-sm h-[55px] justify-between items-center align-middle flex select-none cursor-default'>
      <Link href={'/'}>
        <p className='font-bold text-gray-100 text-xl'>
          <FontAwesomeIcon
            icon={faHeartPulse}
            className='pr-2 hidden md:inline-block'
          />
          PM2 UI
        </p>
      </Link>

        <a
          href='https://www.notion.so/thirtymadison/Eng-Toolkit-d838300886244d9385d08e46b41b51f9#4e39228e65024b0eb31ce3a5f65367f2'
          className='p-1 px-3 flex h-min items-center font-bold text-white rounded-md bg-gradient-to-r from-zinc-600 to-zinc-700 hover:bg-blue-300'
          target='_blank'
        >
          <FontAwesomeIcon
            icon={faBookBookmark}
            className='pr-2 hidden md:inline-block'
          />
          Eng Toolkit
        </a>
    </div>
  );
};

export default Navbar;
