"use client";
import { Suspense } from 'react';
import ChargesForm from '@/components/ablsoftware/Maintance/Charges/Charges';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
            <Suspense fallback={<div>Loading...</div>}>
                <ChargesForm/>
            </Suspense>
        </MainLayout>
    ) //return
}

export default ABL
