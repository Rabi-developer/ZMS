"use client";
import { Suspense } from 'react';
import PaymentABLForm from '@/components/ablsoftware/Maintance/PaymentABL/PaymentABL';
import MainLayout from '@/components/MainLayout/MainLayout'

const CreatePaymentABLPage = () => {

    return (
        <MainLayout activeInterface="ABL">
            <Suspense fallback={<div>Loading...</div>}>
                <PaymentABLForm isEdit={false} />
            </Suspense>
        </MainLayout>
    )
}

export default CreatePaymentABLPage