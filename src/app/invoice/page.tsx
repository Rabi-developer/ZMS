"use client";
import InvoiceList from '@/components/contractportion/invoice/InvoiceList';
import MainLayout from '@/components/MainLayout/MainLayout'

const Invoice = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <InvoiceList/>
        </MainLayout>
    )
}

export default Invoice