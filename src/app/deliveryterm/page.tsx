"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import DeliveryTermList from '@/components/valuemanagement/deliveryterm/DeliveryTermList';
import UnitOfMeasureList from '@/components/valuemanagement/unitofmeasure/UnitOfMeasureList';

const UnitOfMeasure = () => {

    return (
        <MainLayout activeInterface="ZMS">
           <DeliveryTermList/>
        </MainLayout>
    )
}

export default UnitOfMeasure