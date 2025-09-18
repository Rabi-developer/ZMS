"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import BookingOrderForm from '@/components/ablsoftware/Maintance/BookingOrder.tsx/BookingOrder';
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <BookingOrderForm isEdit={true} />
        </MainLayout>
    )
}

export default ABL