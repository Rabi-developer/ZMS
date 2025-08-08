"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import ProjectTargetList from '@/components/projecttarget/ProjectTargetList'
import Saller from '@/components/Saller/SellerForm';

const Organization = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <Saller/>
        </MainLayout>
    )
}

export default Organization