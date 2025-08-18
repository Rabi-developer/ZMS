"use client";
import PaymentABLForm from '@/components/ablsoftware/Maintance/PaymentABL/PaymentABL';
import MainLayout from '@/components/MainLayout/MainLayout'

const CreatePaymentABLPage = () => {

    return (
        <MainLayout activeInterface="ABL">
              <PaymentABLForm isEdit={false} />
        </MainLayout>
    )
}

export default CreatePaymentABLPage