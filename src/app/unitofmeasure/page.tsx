"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import UnitOfMeasureList from '@/components/valuemanagement/unitofmeasure/UnitOfMeasureList';

const UnitOfMeasure = () => {

    return (
        <MainLayout activeInterface="ZMS">
           <UnitOfMeasureList/>
        </MainLayout>
    )
}

export default UnitOfMeasure