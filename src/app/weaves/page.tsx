import DescriptionList from '@/components/item/discription/DiscriptionList'
import WeavesList from '@/components/item/weaves/WeavesList'
import MainLayout from '@/components/MainLayout/MainLayout'

const WeavesPage = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <WeavesList/>
        </MainLayout>
    )
}

export default WeavesPage