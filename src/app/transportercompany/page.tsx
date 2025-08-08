"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import TransporterCompanyList from '@/components/valuemanagement/transportercompany/TransporterCompanyList';

const UnitOfMeasure = () => {

    return (
        <MainLayout activeInterface="ZMS">
           <TransporterCompanyList/>
        </MainLayout>
    )
}

export default UnitOfMeasure