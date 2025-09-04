"use client";
import { Suspense } from 'react';
import ChargesList from '@/components/ablsoftware/Maintance/Charges/ChargesList';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
            <Suspense fallback={<div>Loading...</div>}>
                <ChargesList/>
            </Suspense>
        </MainLayout>
    )
}

export default ABL
