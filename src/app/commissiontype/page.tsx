"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import CommissionTypeList from '@/components/valuemanagement/commissiontype/CommissionTypeList';

const UnitOfMeasure = () => {

    return (
        <MainLayout activeInterface="ZMS">
           <CommissionTypeList/>
        </MainLayout>
    )
}

export default UnitOfMeasure