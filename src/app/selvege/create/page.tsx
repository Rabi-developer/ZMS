import MainLayout from '@/components/MainLayout/MainLayout'
import SelvegeForm from '@/components/item/selvege/Selvege';

const  CreateSelvegePage  = () => {
//   const initialData = {
//     name: '',
//     shortName: '',
//     headOfDepartment: '',
//     addressId: '',
//     branchId: '',
//   };
  return (
    <MainLayout activeInterface="ZMS">  
        <SelvegeForm/>
    </MainLayout>
  )
}

export default  CreateSelvegePage 