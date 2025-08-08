"use client";
import CapitalAccount from '@/components/account/accountcapital/CapitalAccount';
import Liabilities from '@/components/account/liabilities/Liabilities';
import MainLayout from '@/components/MainLayout/MainLayout'

const Organization = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <Liabilities/>
        </MainLayout>
    )
}

export default Organization