"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import BookingOrderForm from '@/components/ablsoftware/Maintance/BookingOrder.tsx/BookingOrder';
import MunshyanaForm from '@/components/ablsoftware/OtherForm/Munshyana/Munshyana';
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <MunshyanaForm isEdit={true} />
        </MainLayout>
    )
}

export default ABL