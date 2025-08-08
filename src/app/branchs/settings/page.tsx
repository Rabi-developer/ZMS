import BranchSetting from '@/components/branches/setting/BranchSetting'
import MainLayout from '@/components/MainLayout/MainLayout'
import React from 'react'

const page = () => {
  return (
    <MainLayout activeInterface="ZMS">
      <BranchSetting />
    </MainLayout>
  )
}

export default page