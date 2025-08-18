"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import ConsignmentForm from '@/components/ablsoftware/Maintance/Consignment/Consignment';
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <ConsignmentForm/>
        </MainLayout>
    )
}

export default ABL