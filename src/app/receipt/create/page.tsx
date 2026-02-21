"use client";
import { Suspense } from 'react';
import MainLayout from '@/components/MainLayout/MainLayout'
import ReceiptForm from '@/components/ablsoftware/Maintance/Receipt/Receipt';
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
            <Suspense fallback={<div>Loading...</div>}>
                <ReceiptForm/>
            </Suspense>
        </MainLayout>
    )
}

export default ABL