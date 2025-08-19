"use client";
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
             <OrderProgress/>
        </MainLayout>
    )
}

export default ABL