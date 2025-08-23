"use client";
import ChargesForm from '@/components/ablsoftware/Maintance/Charges/Charges';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <ChargesForm/>
        </MainLayout>
    ) //return
}

export default ABL