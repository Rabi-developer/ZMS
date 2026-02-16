"use client";
import { Suspense } from 'react';
import MainLayout from '@/components/MainLayout/MainLayout'
import AccountOpeningBalance from '@/components/ablsoftware/voucher/AccountOpenningBalance/AccountOpeningBalance';
import AccountOpeningBalanceList from '@/components/ablsoftware/voucher/AccountOpenningBalance/AccountOpeningBalanceList';

const OpeningBalancePage = () => {
    return (
        <MainLayout activeInterface="ABL">
            <Suspense fallback={<div>Loading...</div>}>
                <AccountOpeningBalanceList/>
            </Suspense>
        </MainLayout>
    )
}

export default OpeningBalancePage;
