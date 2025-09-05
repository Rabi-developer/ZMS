"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import dynamic from 'next/dynamic';

// Disable SSR for this heavy, browser-only component (uses window, jsPDF, XLSX, etc.)
const BookingOrderList = dynamic(
  () => import('@/components/ablsoftware/Maintance/BookingOrder.tsx/BookingOrderList'),
  { ssr: false }
);

const ABL = () => {
  return (
    <MainLayout activeInterface="ABL"> 
      <BookingOrderList />
    </MainLayout>
  );
}

export default ABL