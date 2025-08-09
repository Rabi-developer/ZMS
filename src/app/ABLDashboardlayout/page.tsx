"use client";
import CapitalAccount from '@/components/account/accountcapital/CapitalAccount';
import ABLDashboardlayout from '@/components/Dashboard/ABLDashboardlayout';
import MainLayout from '@/components/MainLayout/MainLayout'

const Organization = () => {

    return (
        <MainLayout activeInterface="ABL">
            <ABLDashboardlayout/>
        </MainLayout>
    )
}

export default Organization