"use client";
import GSMList from '@/components/item/gsm/GsmList';
import MainLayout from '@/components/MainLayout/MainLayout'

const Gsm = () => {

    return (
        <MainLayout activeInterface="ZMS">
           <GSMList/>
        </MainLayout>
    )
}

export default Gsm