"use client";

import React from 'react';
import { FiSearch } from 'react-icons/fi';
import { CommandMenu } from './CommandMenu';
import { MdDashboard } from 'react-icons/md';

export const Search = () => {
      const [open, setOpen] = React.useState(false)
    
  return (
   <>
<div className='bg-[#e7e5e4] mb-5 relative rounded flex items-center  px-2 py-1.5 text-sm mr-[75%]'>
<FiSearch />
<input 
onFocus={(e)=>{
   e.target.blur();
   setOpen(true);
}}
type='text'
 placeholder='  Search Here...'
className=' bg-transparent placeholder:text-stone-400 focus:outline-none text-start w-[50vh]  h-7'/>

</div>
<CommandMenu open={open} setOpen={setOpen} />
   <button>
     
     
   </button>
   </>
 
  ); 
}

export default Search;
