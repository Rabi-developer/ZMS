import MainLayout from '@/components/MainLayout/MainLayout'
import PackingForm from '@/components/item/packing/PackingForm';

const  CreatePackingPage  = () => {
//   const initialData = {
//     name: '',
//     shortName: '',
//     headOfDepartment: '',
//     addressId: '',
//     branchId: '',
//   };
  return (
    <MainLayout>  
        <PackingForm  />
    </MainLayout>
  )
}

export default  CreatePackingPage 