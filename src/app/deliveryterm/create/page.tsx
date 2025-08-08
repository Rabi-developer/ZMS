"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import DeliveryTerm from '@/components/valuemanagement/deliveryterm/DeliveryTerm';

const UnitOfMeasure = () => {

    return (
        <MainLayout activeInterface="ZMS">
           <DeliveryTerm/>
        </MainLayout>
    )
}

export default UnitOfMeasure