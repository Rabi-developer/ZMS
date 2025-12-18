"use client";
import { Suspense } from 'react';
import MainLayout from '@/components/MainLayout/MainLayout'
import BookingOrderForm from '@/components/ablsoftware/Maintance/BookingOrder.tsx/BookingOrder';
import Loader from '@/components/ui/Loader';

const ABL = () => {
    return (
        <MainLayout activeInterface="ABL">
            <Suspense fallback={<Loader />}>
                <BookingOrderForm />
            </Suspense>
        </MainLayout>
    )
}

export default ABL