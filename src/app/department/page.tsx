import MainLayout from '@/components/MainLayout/MainLayout'
import DepartmentList from '@/components/department/DepartmentList'

const Organization = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <DepartmentList />
        </MainLayout>
    )
}

export default Organization