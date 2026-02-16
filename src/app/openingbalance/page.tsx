"use client";
import { Suspense } from 'react';
import OpeningBalanceList from '@/components/ablsoftware/voucher/OpeningBalance/OpeningBalanceList';
import MainLayout from '@/components/MainLayout/MainLayout'

const OpeningBalancePage = () => {
    return (
        <MainLayout activeInterface="ABL">
            <Suspense fallback={<div>Loading...</div>}>
                <OpeningBalanceList/>
            </Suspense>
        </MainLayout>
    )
}

export default OpeningBalancePage;
