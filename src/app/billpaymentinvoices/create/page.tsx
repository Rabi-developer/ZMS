"use client";
import BillPaymentInvoiceForm from '@/components/ablsoftware/Maintance/BillPaymentInvoices/BillPaymentInvoices';
import MainLayout from '@/components/MainLayout/MainLayout'
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <BillPaymentInvoiceForm/>
        </MainLayout>
    )
}

export default ABL