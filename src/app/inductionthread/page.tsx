"use client";
import InductionThreadList from '@/components/item/inductionthread/InductionthreadList';
import MainLayout from '@/components/MainLayout/MainLayout'

const Organization = () => {

    return (
        <MainLayout activeInterface="ZMS">
           <InductionThreadList/>
        </MainLayout>
    )
}

export default Organization;