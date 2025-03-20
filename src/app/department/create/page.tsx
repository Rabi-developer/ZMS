import MainLayout from '@/components/MainLayout/MainLayout'
import Department from '@/components/department/Department';

const createDepartment = () => {
  const initialData = {
    name: '',
    shortName: '',
    headOfDepartment: '',
    addressId: '',
    branchId: '',
  };
  return (
    <MainLayout>  
        <Department branchId={null} initialData={initialData} />
    </MainLayout>
  )
}

export default createDepartment