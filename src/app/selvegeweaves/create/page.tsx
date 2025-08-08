import MainLayout from '@/components/MainLayout/MainLayout'
import SelvegeWeavesForm from '@/components/item/selvegeweaves/SelvegeWeaves';

const  CreateSelvegeWeavesPage  = () => {
//   const initialData = {
//     name: '',
//     shortName: '',
//     headOfDepartment: '',
//     addressId: '',
//     branchId: '',
//   };
  return (
    <MainLayout activeInterface="ZMS">  
        <SelvegeWeavesForm/>
    </MainLayout>
  )
}

export default  CreateSelvegeWeavesPage 