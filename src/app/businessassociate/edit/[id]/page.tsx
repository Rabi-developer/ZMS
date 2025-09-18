"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import BookingOrderForm from '@/components/ablsoftware/Maintance/BookingOrder.tsx/BookingOrder';
import BusinessAssociateForm from '@/components/ablsoftware/OtherForm/Businessassociate/Businessssociate';
import MunshyanaForm from '@/components/ablsoftware/OtherForm/Munshyana/Munshyana';
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <BusinessAssociateForm isEdit={true} />
        </MainLayout>
    )
}

export default ABL