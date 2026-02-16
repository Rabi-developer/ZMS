"use client";
import OpeningBalanceForm from '@/components/ablsoftware/voucher/OpeningBalance/OpeningBalance';
import MainLayout from '@/components/MainLayout/MainLayout'

const EditOpeningBalancePage = () => {
    return (
        <MainLayout activeInterface="ABL">
            <OpeningBalanceForm isEdit={true} />
        </MainLayout>
    )
}

export default EditOpeningBalancePage;
