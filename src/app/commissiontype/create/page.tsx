"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import CommissionType from '@/components/valuemanagement/commissiontype/CommissionType';

const UnitOfMeasure = () => {

    return (
        <MainLayout activeInterface="ZMS">
           <CommissionType/>
        </MainLayout>
    )
}

export default UnitOfMeasure