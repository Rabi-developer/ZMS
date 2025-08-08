import DescriptionList from '@/components/item/discription/DiscriptionList'
import StuffList from '@/components/item/stuff/StuffList'
import MainLayout from '@/components/MainLayout/MainLayout'

const StuffPage = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <StuffList/>
        </MainLayout>
    )
}

export default StuffPage