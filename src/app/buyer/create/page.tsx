"use client";
import { Suspense } from 'react';
import Buyer from '@/components/Buyer/Buyer';
import MainLayout from '@/components/MainLayout/MainLayout'

const Organization = () => {

    return (
        <MainLayout activeInterface="ZMS">
           <Suspense fallback={<div>Loading...</div>}>
               <Buyer/>
           </Suspense>
        </MainLayout>
    )
}

export default Organization