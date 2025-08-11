"use client";
import AblLiabilitiesForm from '@/components/ablsoftware/chartsofaccount/AblLiabilities/AblLiabilitiesForm';
import AblRevenueForm from '@/components/ablsoftware/chartsofaccount/ABLRevenue/ABLRevenueForm';
import ABLDashboardlayout from '@/components/Dashboard/ABLDashboardlayout';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
           <AblRevenueForm/>
        </MainLayout>
    )
}

export default ABL