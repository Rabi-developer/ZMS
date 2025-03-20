import MainLayout from '@/components/MainLayout/MainLayout'
import EmployeeManagementForm from '@/components/Employee/EmployeeManagement/EmployeeManagementForm';

const createEmployeeManagement = () => {
  const initialData = {
    name: '',
    shortName: '',
    headOfDepartment: '',
    addressId: '',
    branchId: '',
  };
  return (
    <MainLayout>  
        <EmployeeManagementForm/>
    </MainLayout>
  )
}

export default createEmployeeManagement