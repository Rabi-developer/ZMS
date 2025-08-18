"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import ReceiptList from '@/components/ablsoftware/Maintance/Receipt/ReceiptList';
const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <ReceiptList/>
        </MainLayout>
    )
}

export default ABL