"use client";
    import MainLayout from '@/components/MainLayout/MainLayout'
import ProjectTargetList from '@/components/projecttarget/ProjectTargetList'

const Organization = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <ProjectTargetList/>
        </MainLayout>
    )
}

export default Organization