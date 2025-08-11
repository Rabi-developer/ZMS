"use client";
import AblLiabilitiesForm from '@/components/ablsoftware/chartsofaccount/AblLiabilities/AblLiabilitiesForm';
import ABLDashboardlayout from '@/components/Dashboard/ABLDashboardlayout';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
           <AblLiabilitiesForm/>
        </MainLayout>
    )
}

export default ABL