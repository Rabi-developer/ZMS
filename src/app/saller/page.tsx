"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import ProjectTargetList from '@/components/projecttarget/ProjectTargetList'
import Saller from '@/components/Saller/SellerForm';
import SellerList from '@/components/Saller/SellerList';

const Organization = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <SellerList/>
        </MainLayout>
    )
}

export default Organization