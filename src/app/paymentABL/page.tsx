"use client";
import PaymentABLList from '@/components/ablsoftware/Maintance/PaymentABL/PaymentABLList';
import MainLayout from '@/components/MainLayout/MainLayout'

const PaymentABLPage = () => {

    return (
        <MainLayout activeInterface="ABL">
              <PaymentABLList/>
        </MainLayout>
    )
}

export default PaymentABLPage