"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import VehicleTypeList from '@/components/valuemanagement/transportercompany/TransporterCompanyList';

const UnitOfMeasure = () => {

    return (
        <MainLayout activeInterface="ZMS">
           <VehicleTypeList/>
        </MainLayout>
    )
}

export default UnitOfMeasure