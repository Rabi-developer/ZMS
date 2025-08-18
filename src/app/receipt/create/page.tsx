"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import ReceiptForm from '@/components/ablsoftware/Maintance/Receipt/Receipt';
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
             <ReceiptForm/>
        </MainLayout>
    )
}

export default ABL