import MainLayout from '@/components/MainLayout/MainLayout'
import Address from '@/components/address/Address';
import BlendRatioForm from '@/components/item/BlendRatio/BlendRatioForm';

const  CreateBlendRatioPage  = () => {
//   const initialData = {
//     name: '',
//     shortName: '',
//     headOfDepartment: '',
//     addressId: '',
//     branchId: '',
//   };
  return (
    <MainLayout activeInterface="ZMS">  
        <BlendRatioForm  />
    </MainLayout>
  )
}

export default  CreateBlendRatioPage 