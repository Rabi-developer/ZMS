"use client";
import dynamic from 'next/dynamic';
import MainLayout from '@/components/MainLayout/MainLayout'
const PaymentABLList = dynamic(
    () => import('@/components/ablsoftware/Maintance/PaymentABL/PaymentABLList'),
    { ssr: false }
  );
const PaymentABLPage = () => {

    return (
        <MainLayout activeInterface="ABL">        
                <PaymentABLList/>
        </MainLayout>
    )
}

export default PaymentABLPage
