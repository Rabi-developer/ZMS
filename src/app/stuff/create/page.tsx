import MainLayout from '@/components/MainLayout/MainLayout'
import Address from '@/components/address/Address';
import DescriptionForm from '@/components/item/discription/Description';
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
    <MainLayout>  
        <StuffForm/>
    </MainLayout>
  )
}

export default  CreateStuffPage 