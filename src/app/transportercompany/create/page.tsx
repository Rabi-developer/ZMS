"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import TransporterCompany from '@/components/valuemanagement/transportercompany/TransporterCompany';
import VehicleType from '@/components/valuemanagement/transportercompany/TransporterCompany';

const UnitOfMeasure = () => {

    return (
        <MainLayout activeInterface="ZMS">
          <TransporterCompany/>
        </MainLayout>
    )
}

export default UnitOfMeasure