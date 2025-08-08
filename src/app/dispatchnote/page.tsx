import MainLayout from '@/components/MainLayout/MainLayout'
import DispatchNoteList from '@/components/dispatchnote/DispatchNoteList'

const DescriptionPage = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <DispatchNoteList/>
        </MainLayout>
    )
}

export default DescriptionPage