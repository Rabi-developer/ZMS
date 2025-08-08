"use client";
import CapitalAccount from '@/components/account/accountcapital/CapitalAccount';
import Assets from '@/components/account/Assets/Assets';
import MainLayout from '@/components/MainLayout/MainLayout'

const Organization = () => {

    return (
        <MainLayout activeInterface="ZMS">
          <Assets/>
        </MainLayout>
    )
}

export default Organization