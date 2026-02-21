"use client";
import { Suspense } from 'react';
import BillPaymentInvoiceForm from '@/components/ablsoftware/Maintance/BillPaymentInvoices/BillPaymentInvoices';
import MainLayout from '@/components/MainLayout/MainLayout'
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
            <Suspense fallback={<div>Loading...</div>}>
                <BillPaymentInvoiceForm/>
            </Suspense>
        </MainLayout>
    )
}

export default ABL