'use client';
import React from 'react';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout/MainLayout';
import { FiList, FiPlus, FiArrowLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { GiStabbedNote, GiInauguration, GiYarn, GiSoundWaves, GiCardPickup, GiRolledCloth, GiWaves } from 'react-icons/gi';
import {  FaPiedPiperSquare, FaBuffer,  } from 'react-icons/fa';
import { PiYarnFill } from 'react-icons/pi';
import { SiThefinals } from 'react-icons/si';
import { RiExpandWidthFill } from 'react-icons/ri';
import { FaArrowTrendDown } from "react-icons/fa6";
import { FaCartFlatbedSuitcase } from "react-icons/fa6";
import { FaBoxesPacking } from "react-icons/fa6";
import { FcBullish } from "react-icons/fc";

const forms = [
  { name: 'Description', listRoute: '/description', createRoute: '/description/create', description: 'Manage item descriptions', icon: GiStabbedNote },
  { name: 'Stuff', listRoute: '/stuff', createRoute: '/stuff/create', description: 'Organize stuff details', icon: FaCartFlatbedSuitcase },
  { name: 'Blend Ratio', listRoute: '/bendRatio', createRoute: '/bendRatio/create', description: 'Configure blend ratios', icon: GiInauguration },
  { name: 'Wrap Yarn Type', listRoute: '/wrapyarntype', createRoute: '/wrapyarntype/create', description: 'Define wrap yarn types', icon: GiYarn },
  { name: 'Weft Yarn Type', listRoute: '/weftyarntype', createRoute: '/weftyarntype/create', description: 'Set weft yarn types', icon: PiYarnFill },
  { name: 'Weaves', listRoute: '/weaves', createRoute: '/weaves/create', description: 'Manage weave patterns', icon: GiSoundWaves },
  { name: 'Pick Insertion', listRoute: '/pickinsertion', createRoute: '/pickinsertion/create', description: 'Configure pick insertions', icon: GiCardPickup },
  { name: 'Final', listRoute: '/final', createRoute: '/final/create', description: 'Finalize configurations', icon: SiThefinals },
  { name: 'Selvege', listRoute: '/selvege', createRoute: '/selvege/create', description: 'Manage selvege settings', icon: GiRolledCloth },
  { name: 'Selvege Weaves', listRoute: '/selvegeweaves', createRoute: '/selvegeweaves/create', description: 'Define selvege weave patterns', icon: GiWaves },
  { name: 'Selvege Width', listRoute: '/selvegewidth', createRoute: '/selvegewidth/create', description: 'Set selvege widths', icon: RiExpandWidthFill },
  { name: 'Peice Length', listRoute: '/peicelength', createRoute: '/peicelength/create', description: 'Configure piece lengths', icon: FaPiedPiperSquare },
  { name: 'Packing', listRoute: '/packing', createRoute: '/packing/create', description: 'Manage packing details', icon: FaBoxesPacking },
  { name: 'Fabric Types', listRoute: '/fabrictypes', createRoute: '/fabrictypes/create', description: 'Define fabric types', icon: FaBuffer },
  { name: 'End Use', listRoute: '/enduse', createRoute: '/enduse/create', description: 'Specify end-use categories', icon: FaArrowTrendDown },
];

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };
  
  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
  };

const FormsOverview = () => {
  return (
  
      <div className="container mx-auto px-4 py-12">
      
<div className="relative mb-12">
  <div className="absolute inset-0 bg-gradient-to-r from-[#06b6d4] via-[#3b82f6] to-[#0891b2] opacity-90 blur-lg rounded-3xl animate-pulse"></div>

  <div className="relative bg-white/30 dark:bg-[#0f172a]/40 backdrop-blur-2xl p-10 rounded-3xl shadow-2xl border border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-3xl">
    
    <h1 className="text-5xl text-gray-700 font-extrabold   text-center drop-shadow-lg tracking-wide">
      Add All Items
    </h1>
    
    <p className="text-center text-gray-700 dark:text-gray-300 mt-4 text-lg tracking-wide">
      Manage and organize all your entries in items!
    </p>

  </div>
</div>


        {/* Cards Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          <AnimatePresence>
            {forms.map((form) => (
              <motion.div
                key={form.name}
                variants={cardVariants}
                className="relative group bg-white dark:bg-[#030630] rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
                whileHover={{ scale: 1.05, rotateX: 2, rotateY: 2, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Gradient Border Accent */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#33a4d8] to-[#0891b2] opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
                <div className="relative p-6 z-10 flex flex-col items-center">
                  {/* Form Icon */}
                  <form.icon className="text-[#33a4d8] text-4xl mb-4" />
                  {/* Form Name and Tooltip */}
                  <h2 className="text-xl font-semibold text-[#197cb0] dark:text-white mb-4 flex items-center gap-2">
                    {form.name}
                    <span className="relative group/tooltip">
                      <svg
                        className="w-5 h-5 text-gray-400 dark:text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block w-max px-3 py-1 text-sm text-white bg-gradient-to-r from-[#33a4d8] to-[#0891b2] rounded-md shadow-lg">
                        {form.description}
                      </span>
                    </span>
                  </h2>
                  {/* Buttons */}
                  <div className="flex flex-col gap-3 w-full">
                    <Link href={form.listRoute}>
                      <motion.button
                        className="w-full flex items-center justify-center gap-2 bg-[#33a4d8] hover:bg-[#2b8bb3] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiList className="text-lg" />
                        View List
                      </motion.button>
                    </Link>
                    <Link href={form.createRoute}>
                      <motion.button
                        className="w-full flex items-center justify-center gap-2 bg-[#33a4d8] hover:bg-[#2b8bb3] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiPlus className="text-lg" />
                        Create New
                      </motion.button>
                    </Link>
                  </div>
                </div>
                {/* Glowing Overlay */}
                <div className="absolute inset-0 bg-[#33a4d8]/10 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none rounded-lg"></div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        <div className="flex justify-center mt-12">
          <Link href="/">
            <motion.button
              className="flex items-center gap-2 bg-gradient-to-r from-[#33a4d8] to-[#0891b2] text-white px-8 py-3 rounded-lg text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <FiArrowLeft className="text-lg" />
              Back to Dashboard
            </motion.button>
          </Link>
        </div>
      </div>

  );
};

export default FormsOverview;