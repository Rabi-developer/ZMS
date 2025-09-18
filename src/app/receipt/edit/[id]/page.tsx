"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import BookingOrderForm from '@/components/ablsoftware/Maintance/BookingOrder.tsx/BookingOrder';
import ReceiptForm from '@/components/ablsoftware/Maintance/Receipt/Receipt';
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <ReceiptForm isEdit={true} />
        </MainLayout>
    )
}

export default ABL