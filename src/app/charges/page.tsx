"use client";
import dynamic from 'next/dynamic';
import MainLayout from '@/components/MainLayout/MainLayout'

const ChargesList = dynamic(
  () => import('@/components/ablsoftware/Maintance/Charges/ChargesList'),
  { ssr: false }
);
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">   
                <ChargesList/>
        </MainLayout>
    )
}

export default ABL
