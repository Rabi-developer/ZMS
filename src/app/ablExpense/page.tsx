"use client";
import AblExpenseForm from '@/components/ablsoftware/chartsofaccount/ABLExpense/ABLExpenseForm';
import AblLiabilitiesForm from '@/components/ablsoftware/chartsofaccount/AblLiabilities/AblLiabilitiesForm';
import ABLDashboardlayout from '@/components/Dashboard/ABLDashboardlayout';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <AblExpenseForm/>
        </MainLayout>
    )
}

export default ABL