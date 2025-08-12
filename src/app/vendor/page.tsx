"use client";
import VendorList from '@/components/ablsoftware/OtherForm/Vendor/VendorList';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <VendorList/>
        </MainLayout>
    )
}

export default ABL