import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Command } from 'cmdk';
import { FiEdit, FiEye, FiLogOut, FiPlus, FiRepeat } from "react-icons/fi";



export const CommandMenu = ({
  open,
  setOpen,
}:{
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [value, setValue] = useState("")

  // Toggle the menu when ⌘K is pressed
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prevOpen) => !prevOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Global Command Menu"
    className="fixed inset-0 bg-stone-950/50 "
    onClick={() => setOpen(false)}>
   <div onClick={(e) => e.stopPropagation()} 
    className="bg-white rounded-lg shadow-xl border-stone-300 border overflow-hidden w-full max-w-lg mx-auto mt-12">
   <Command.Input 
   value={value}
   onValueChange={setValue}
   placeholder="What do you need?"
   className="relative border-b border-stone-300 p-3 text-lg  placeholder:text-stone-400 focus:outline-none"
   
   />
    <Command.List>
        <Command.Empty>No results found For{" "} 
          <span className="text-violet-500 hover:text-violet-300">"{value}"</span> 

        </Command.Empty>

        <Command.Group heading="ZMS Team"
        className="text-sm mb-3 text-stone-400 ml-2">

          <Command.Item
          className="flex cursor-pointer transition-colors p-2 text-sm text-stone-950 hover:bg-stone-200  rounded items-center gap-2"
          >
            <FiPlus/>
            Invite Member
          </Command.Item>


          <Command.Item
           className="flex cursor-pointer transition-colors p-2 text-sm text-stone-950 hover:bg-stone-200  rounded items-center gap-2">
             <FiEye/>
             See Selling Graph
          </Command.Item>
          <Command.Separator />
          {/* <Command.Item>c</Command.Item> */}
        </Command.Group>

        <Command.Group heading="Report"
        className="text-sm mb-3 text-stone-400 ml-2">

          <Command.Item
          className="flex cursor-pointer transition-colors p-2 text-sm text-stone-950 hover:bg-stone-200  rounded items-center gap-2"
          >
            <FiEdit/>
            Inventory Report 
          </Command.Item>


          <Command.Item
           className="flex cursor-pointer transition-colors p-2 text-sm text-stone-950 hover:bg-stone-200  rounded items-center gap-2">
             <FiRepeat/>
             Client Report
          </Command.Item>
          <Command.Separator />
          {/* <Command.Item>c</Command.Item> */}
        </Command.Group>
<Command.Item className="flex cursor-pointer tranitition-colors p=2 h-7 text-white  text-sm text-stobe-50 hover:bg-stone-700 bg-stone-950 rounded items-center gap-2">
  <FiLogOut className="ml-4"/>
   Log Out
</Command.Item>


      </Command.List>
   </div>
    </Command.Dialog>
  );
}
