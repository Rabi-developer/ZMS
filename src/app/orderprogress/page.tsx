"use client";
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';
import MainLayout from '@/components/MainLayout/MainLayout'

const OrderProgressContent = () => {
    const searchParams = useSearchParams();
    const orderNo = searchParams.get('orderNo');
    const bookingOrderId = searchParams.get('bookingOrderId');

    return (
         <OrderProgress orderNo={orderNo} bookingOrderId={bookingOrderId || undefined} />
    )
}

const ABL = () => {
    return (
        <MainLayout activeInterface="ABL">
             <Suspense fallback={<div>Loading...</div>}>
                <OrderProgressContent />
             </Suspense>
        </MainLayout>
    )
}

export default ABL