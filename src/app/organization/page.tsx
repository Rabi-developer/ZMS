import MainLayout from '@/components/MainLayout/MainLayout'
import OrganizationList from '@/components/Organization/Commpany/OrganizationList'

const Organization = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <OrganizationList />
        </MainLayout>
    )
}

export default Organization