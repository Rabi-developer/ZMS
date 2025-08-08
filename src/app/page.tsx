'use client';
import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout/MainLayout';
import Dashboardlayout from '@/components/Dashboard/Dashboardlayout';
import ABLDashboardlayout from '@/components/Dashboard/ABLDashboardlayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiPackage, FiTruck } from 'react-icons/fi';

export default function Home() {
  const [activeInterface, setActiveInterface] = useState<'ZMS' | 'ABL' | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  React.useEffect(() => {
    const storedUserName = localStorage.getItem('userName');
    setUserName(storedUserName);
  }, []);

  const cardVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { scale: 1.03, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-[#030630] overflow-y-auto">
      {activeInterface === null ? (
        <div className="relative">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 md:px-8 lg:px-12 max-w-7xl mx-auto bg-gray-100 rounded-2xl shadow-md"
          >
            <h1 className="text-3xl font-bold  text-gray-800 dark:text-white">
              ZMS & ABL Transport
            </h1>
            <Link
              href="/signin"
              className={`text-white font-medium rounded-full px-4 py-2 text-sm ${
                userName
                  ? activeInterface === 'ABL'
                    ? 'bg-[#1a5f3a] hover:bg-[#2a7f4a]'
                    : 'bg-blue-600 hover:bg-blue-700'
                  : activeInterface === 'ABL'
                    ? 'bg-[#1a5f3a] hover:bg-[#2a7f4a]'
                    : 'bg-blue-600 hover:bg-blue-700'
              }`}
              onClick={() => {
                if (userName) {
                  localStorage.removeItem('userName');
                  setUserName(null);
                }
              }}
            >
              {userName ? 'Logout' : 'Login'}
            </Link>
          </motion.div>

          {/* Main Content */}
          <div className="pt-24 pb-12 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
                Optimize Your Business
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Discover the power of ZMS for commision management or ABL for transport logistics. Select a platform to streamline your operations with cutting-edge tools.
              </p>
            </motion.div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* ZMS Card */}
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                className="relative bg-white dark:bg-[#030630]/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('/warehouse-bg.jpg')] bg-cover bg-center opacity-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                  <img src="/ZMS-Logo.png" alt="ZMS Logo" className="h-40 w-40" />
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                      ZMS - Commision Based
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    ZMS provides a comprehensive solution for managing inventory, tracking stock, and analyzing sales with real-time insights.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                    <li>Real-time stock tracking</li>
                    <li>Sales and profit analytics</li>
                    <li>Automated workflows</li>
                    <li>Customizable reports</li>
                  </ul>
                  <motion.button
                    onClick={() => setActiveInterface('ZMS')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#06b6d4] to-[#0899b2] text-white rounded-full text-lg font-semibold hover:from-[#0899b2] hover:to-[#067a8f] transition-all duration-300 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Enter ZMS Dashboard
                  </motion.button>
                </div>
              </motion.div>

              {/* ABL Card */}
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                className="relative bg-white dark:bg-[#1a2a22]/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-[#d4a017] overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('/transport-bg.jpg')] bg-cover bg-center opacity-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                   <img src="/ABL-Logo.png" alt="ABL Logo" className="h-13 w-13" />
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                      ABL - Transport Logistics
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    ABL streamlines transport operations with tools for vehicle management, route optimization, and cost tracking.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                    <li>Vehicle and fleet management</li>
                    <li>Route planning and scheduling</li>
                    <li>Fuel and maintenance tracking</li>
                    <li>Real-time delivery updates</li>
                  </ul>
                  <motion.button
                    onClick={() => setActiveInterface('ABL')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#1a5f3a] to-[#2a7f4a] text-white rounded-full text-lg font-semibold hover:from-[#2a7f4a] hover:to-[#3a9f5a] transition-all duration-300 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Enter ABL Dashboard
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      ) : (
        <MainLayout activeInterface={activeInterface}>
          {activeInterface === 'ZMS' ? <Dashboardlayout /> : <ABLDashboardlayout />}
        </MainLayout>
      )}
    </div>
  );
}