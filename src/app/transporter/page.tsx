"use client";
import AblExpenseForm from '@/components/ablsoftware/chartsofaccount/ABLExpense/ABLExpenseForm';
import AblLiabilitiesForm from '@/components/ablsoftware/chartsofaccount/AblLiabilities/AblLiabilitiesForm';
import TransporterForm from '@/components/ablsoftware/OtherForm/Transport/Transporter';
import TransporterList from '@/components/ablsoftware/OtherForm/Transport/TransporterList';
import ABLDashboardlayout from '@/components/Dashboard/ABLDashboardlayout';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <TransporterList/>
        </MainLayout>
    )
}

export default ABL