"use client";
import { Suspense } from 'react';
import PaymentABLList from '@/components/ablsoftware/Maintance/PaymentABL/PaymentABLList';
import MainLayout from '@/components/MainLayout/MainLayout'

const PaymentABLPage = () => {

    return (
        <MainLayout activeInterface="ABL">
            <Suspense fallback={<div>Loading...</div>}>
                <PaymentABLList/>
            </Suspense>
        </MainLayout>
    )
}

export default PaymentABLPage
