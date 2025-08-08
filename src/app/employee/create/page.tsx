import MainLayout from '@/components/MainLayout/MainLayout'
import EmployeeForm from '@/components/Employee/EmployeeForm';

const createEmployee = () => {
  const initialData = {
    name: '',
    shortName: '',
    headOfDepartment: '',
    addressId: '',
    branchId: '',
  };
  return (
    <MainLayout activeInterface="ZMS">  
        <EmployeeForm branchId={null} initialData={initialData} />
    </MainLayout>
  )
}

export default createEmployee