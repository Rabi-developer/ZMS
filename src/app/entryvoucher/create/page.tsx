"use client";
import { Suspense } from 'react';
import EntryVoucherForm from '@/components/ablsoftware/voucher/Entry Voucher/EntryVoucher';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
            <Suspense fallback={<div>Loading...</div>}>
                <EntryVoucherForm/>
            </Suspense>
        </MainLayout>
    )
}

export default ABL