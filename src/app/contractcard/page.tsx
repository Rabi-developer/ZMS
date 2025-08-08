"use client";
import ContractSummaryCard from '@/components/contractcard/ContractSummaryCard';
import MainLayout from '@/components/MainLayout/MainLayout'

const ContractCard = () => {

    return (
        <MainLayout activeInterface="ZMS">
           <ContractSummaryCard/>
        </MainLayout>
    )
}

export default ContractCard