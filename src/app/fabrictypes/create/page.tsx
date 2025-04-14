import MainLayout from '@/components/MainLayout/MainLayout'
import FabricTypeForm from '@/components/item/fabrictypes/FabricTypeForm';

const  CreateFabricTypePage  = () => {
//   const initialData = {
//     name: '',
//     shortName: '',
//     headOfDepartment: '',
//     addressId: '',
//     branchId: '',
//   };
  return (
    <MainLayout>  
        <FabricTypeForm/>
    </MainLayout>
  )
}

export default  CreateFabricTypePage 