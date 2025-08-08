import MainLayout from '@/components/MainLayout/MainLayout'
import StuffForm from '@/components/item/stuff/StuffForm';

const  CreateStuffPage  = () => {
//   const initialData = {
//     name: '',
//     shortName: '',
//     headOfDepartment: '',
//     addressId: '',
//     branchId: '',
//   };
  return (
    <MainLayout activeInterface="ZMS">  
        <StuffForm/>
    </MainLayout>
  )
}

export default  CreateStuffPage 