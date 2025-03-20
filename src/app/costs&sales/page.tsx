"use client";
import CapitalAccount from '@/components/account/accountcapital/CapitalAccount';
import CostsSales from '@/components/account/costs&sales/CostsSales';
import MainLayout from '@/components/MainLayout/MainLayout'

const Organization = () => {

    return (
        <MainLayout>
          <CostsSales/>
        </MainLayout>
    )
}

export default Organization