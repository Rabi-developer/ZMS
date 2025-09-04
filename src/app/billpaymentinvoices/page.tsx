"use client";
import { Suspense } from 'react';
import BillPaymentInvoicesList from '@/components/ablsoftware/Maintance/BillPaymentInvoices/BillPaymentInvoicesList';
import MainLayout from '@/components/MainLayout/MainLayout'
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
            <Suspense fallback={<div>Loading...</div>}>
                <BillPaymentInvoicesList/>
            </Suspense>
        </MainLayout>
    )
}

export default ABL
