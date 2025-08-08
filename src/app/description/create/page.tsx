import MainLayout from '@/components/MainLayout/MainLayout'
import Address from '@/components/address/Address';
import DescriptionForm from '@/components/item/discription/Description';

const  CreateDescriptionPage  = () => {
//   const initialData = {
//     name: '',
//     shortName: '',
//     headOfDepartment: '',
//     addressId: '',
//     branchId: '',
//   };
  return (
    <MainLayout activeInterface="ZMS">  
        <DescriptionForm  />
    </MainLayout>
  )
}

export default  CreateDescriptionPage 