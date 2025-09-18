"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import BookingOrderForm from '@/components/ablsoftware/Maintance/BookingOrder.tsx/BookingOrder';
import PartyForm from '@/components/ablsoftware/OtherForm/Party/Party';
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <PartyForm isEdit={true} />
        </MainLayout>
    )
}

export default ABL