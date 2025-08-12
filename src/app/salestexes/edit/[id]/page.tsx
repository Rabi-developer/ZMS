"use client";
import SalesTaxesForm from '@/components/ablsoftware/OtherForm/SaleTexes/SaleTexes';
import MainLayout from '@/components/MainLayout/MainLayout'

const EditSalesTax = () => {

    return (
        <MainLayout activeInterface="ABL">
              <SalesTaxesForm isEdit={true}/>
        </MainLayout>
    )
}

export default EditSalesTax