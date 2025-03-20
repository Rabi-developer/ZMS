import MainLayout from '@/components/MainLayout/MainLayout'
import Address from '@/components/address/Address';

const createAddress = () => {
  const initialData = {
    name: '',
    shortName: '',
    headOfDepartment: '',
    addressId: '',
    branchId: '',
  };
  return (
    <MainLayout>  
        <Address branchId={null} initialData={initialData} />
    </MainLayout>
  )
}

export default createAddress