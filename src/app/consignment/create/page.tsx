"use client";
import { Suspense } from 'react';
import MainLayout from '@/components/MainLayout/MainLayout'
import ConsignmentForm from '@/components/ablsoftware/Maintance/Consignment/Consignment';
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
            <Suspense fallback={<div>Loading...</div>}>
                <ConsignmentForm/>
            </Suspense>
        </MainLayout>
    )
}

export default ABL
