"use client";
import BrookersList from '@/components/ablsoftware/OtherForm/Brookers/BrookersList';
import MainLayout from '@/components/MainLayout/MainLayout'

const ABL = () => {

    return (
        <MainLayout activeInterface="ABL">
              <BrookersList />
        </MainLayout>
    )
}

export default ABL