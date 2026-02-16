"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import OpeningBalanceForm from '../../../components/ablsoftware/voucher/OpeningBalance/OpeningBalance';

const ABL = () => {

    return (
         <MainLayout activeInterface="ABL">
            <OpeningBalanceForm isEdit={false} />
        </MainLayout>
    )
}

export default ABL;
