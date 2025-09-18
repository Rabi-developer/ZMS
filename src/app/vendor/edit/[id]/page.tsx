"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import BookingOrderForm from '@/components/ablsoftware/Maintance/BookingOrder.tsx/BookingOrder';
import VendorForm from '@/components/ablsoftware/OtherForm/Vendor/Vendor';
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <VendorForm isEdit={true} />
        </MainLayout>
    )
}

export default ABL