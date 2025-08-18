"use client";
import ChargesList from '@/components/ablsoftware/Maintance/Charges/ChargesList';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <ChargesList/>
        </MainLayout>
    )
}

export default ABL