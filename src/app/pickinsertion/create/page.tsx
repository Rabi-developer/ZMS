import MainLayout from '@/components/MainLayout/MainLayout'
import PickInsertion from '@/components/item/pickinsertion/PickInsertion';

const  CreatePickInsertionPage  = () => {
//   const initialData = {
//     name: '',
//     shortName: '',
//     headOfDepartment: '',
//     addressId: '',
//     branchId: '',
//   };
  return (
    <MainLayout activeInterface="ZMS">  
        <PickInsertion  />
    </MainLayout>
  )
}

export default  CreatePickInsertionPage 