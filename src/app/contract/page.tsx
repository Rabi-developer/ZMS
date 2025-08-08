"use client";
import ContractList from '@/components/contract/ContractList';
import MainLayout from '@/components/MainLayout/MainLayout'

const Organization = () => {

    return (
        <MainLayout activeInterface="ZMS">
             <ContractList/>
        </MainLayout>
    )
}

export default Organization