"use client";
import dynamic from 'next/dynamic';
const MainLayout = dynamic(() => import('@/components/MainLayout/MainLayout'), { ssr: false });
const ReceiptList = dynamic(() => import('@/components/ablsoftware/Maintance/Receipt/ReceiptList'), { ssr: false });

const ABL = () => {
  return (
    <MainLayout activeInterface="ABL">
      <ReceiptList />
    </MainLayout>
  );
};

export default ABL