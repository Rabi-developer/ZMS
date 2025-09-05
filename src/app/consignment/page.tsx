"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import dynamic from 'next/dynamic';
const ConsignmentList = dynamic(
    () => import('@/components/ablsoftware/Maintance/Consignment/ConsignmentList'),
    { ssr: false }
  );
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <ConsignmentList/>
        </MainLayout>
    )
}

export default ABL