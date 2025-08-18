"use client";
import PaymentABLForm from '@/components/ablsoftware/Maintance/PaymentABL/PaymentABL';
import MainLayout from '@/components/MainLayout/MainLayout'

const EditPaymentABLPage = () => {

    return (
        <MainLayout activeInterface="ABL">
              <PaymentABLForm isEdit={true} />
        </MainLayout>
    )
}

export default EditPaymentABLPage