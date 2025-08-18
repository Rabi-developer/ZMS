"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import BookingOrderList from '@/components/ablsoftware/Maintance/BookingOrder.tsx/BookingOrderList';
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <BookingOrderList />
        </MainLayout>
    )
}

export default ABL