"use client";
import { Suspense } from 'react';
import MainLayout from '@/components/MainLayout/MainLayout'
import ProjectTargetList from '@/components/projecttarget/ProjectTargetList'
import Saller from '@/components/Saller/SellerForm';

const Organization = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <Suspense fallback={<div>Loading...</div>}>
                <Saller/>
            </Suspense>
        </MainLayout>
    )
}

export default Organization