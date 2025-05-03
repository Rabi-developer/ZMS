"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import DeliveryTermList from '@/components/valuemanagement/deliveryterm/DeliveryTermList';
import UnitOfMeasureList from '@/components/valuemanagement/unitofmeasure/UnitOfMeasureList';

const UnitOfMeasure = () => {

    return (
        <MainLayout>
           <DeliveryTermList/>
        </MainLayout>
    )
}

export default UnitOfMeasure