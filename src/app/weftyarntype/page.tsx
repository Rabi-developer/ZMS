import DescriptionList from '@/components/item/discription/DiscriptionList'
import WeftYarnTypeList from '@/components/item/weftyarntype/WeftYarnTypeList'
import MainLayout from '@/components/MainLayout/MainLayout'

const WeftYarnTypePage = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <WeftYarnTypeList/>
        </MainLayout>
    )
}

export default WeftYarnTypePage