import MainLayout from '@/components/MainLayout/MainLayout'
import BranchList from '@/components/branches/BranchList'

const Branches = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <BranchList />
        </MainLayout>
    )
}

export default Branches