"use client";
import MainLayout from '@/components/MainLayout/MainLayout'
import ProjectTarget from '@/components/projecttarget/ProjectTarget';

const createProjectTarget = () => {
  const initialData = {
    name: '',
    shortName: '',
    headOfDepartment: '',
    addressId: '',
    branchId: '',
  };
  return (
    <MainLayout>  
        <ProjectTarget branchId={null} initialData={initialData} />
    </MainLayout>
  )
}

export default createProjectTarget