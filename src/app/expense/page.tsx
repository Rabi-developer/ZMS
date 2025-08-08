"use client";
import Expense from '@/components/account/Expense/Expense';
import AdminSellingExp from '@/components/account/Expense/Expense';
import MainLayout from '@/components/MainLayout/MainLayout'

const Organization = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <Expense/>
        </MainLayout>
    )
}

export default Organization