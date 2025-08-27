"use client";
import EntryVoucherForm from '@/components/ablsoftware/voucher/Entry Voucher/EntryVoucher';
import EntryVoucherList from '@/components/ablsoftware/voucher/Entry Voucher/EntryVoucherList';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
            <EntryVoucherList/>
        </MainLayout>
    )
}

export default ABL