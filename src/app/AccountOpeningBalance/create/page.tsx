"use client";
import { Suspense } from 'react';
import MainLayout from '@/components/MainLayout/MainLayout'
import AccountOpeningBalance from '@/components/ablsoftware/voucher/AccountOpenningBalance/AccountOpeningBalance';

const OpeningBalancePage = () => {
    return (
        <MainLayout activeInterface="ABL">
            <Suspense fallback={<div>Loading...</div>}>
                <AccountOpeningBalance/>
            </Suspense>
        </MainLayout>
    )
}

export default OpeningBalancePage;
