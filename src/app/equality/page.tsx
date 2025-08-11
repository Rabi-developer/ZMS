"use client";
import EqualityForm from '@/components/ablsoftware/chartsofaccount/Equality/EqualityForm';
import CapitalAccount from '@/components/account/accountcapital/CapitalAccount';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
            <EqualityForm />
        </MainLayout>
    )
}

export default ABL