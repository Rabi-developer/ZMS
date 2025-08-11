"use client";
import AblAssestsForm from '@/components/ablsoftware/chartsofaccount/ABLAssests/ABLAssests';
import AblLiabilitiesForm from '@/components/ablsoftware/chartsofaccount/AblLiabilities/AblLiabilitiesForm';
import ABLDashboardlayout from '@/components/Dashboard/ABLDashboardlayout';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
           <AblAssestsForm/>
        </MainLayout>
    )
}

export default ABL