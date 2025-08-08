import EmployeeManagementForm from '@/components/Employee/EmployeeManagement/EmployeeManagementForm'
import EmployeeManagementList from '@/components/Employee/EmployeeManagement/EmployeeManagementList'
import MainLayout from '@/components/MainLayout/MainLayout'
import DepartmentList from '@/components/department/DepartmentList'

const Organization = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <EmployeeManagementList />
        </MainLayout>
    )
}

export default Organization