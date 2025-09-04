"use client";
import { Suspense } from 'react';
import EntryVoucherList from '@/components/ablsoftware/voucher/Entry Voucher/EntryVoucherList';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
            <Suspense fallback={<div>Loading...</div>}>
                <EntryVoucherList/>
            </Suspense>
        </MainLayout>
    )
}

export default ABL
