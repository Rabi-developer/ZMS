"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import ConsignmentList from '@/components/ablsoftware/Maintance/Consignment/ConsignmentList';
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <ConsignmentList/>
        </MainLayout>
    )
}

export default ABL