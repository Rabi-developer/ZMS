import MainLayout from '@/components/MainLayout/MainLayout'
import BlendRatioForm from '@/components/item/blendratio/BlendRatioForm';

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