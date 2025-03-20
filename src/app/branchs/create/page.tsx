import MainLayout from '@/components/MainLayout/MainLayout'
import Branch from '@/components/branches/Branch'
import React from 'react'

const CreateBranch = () => {
  const initialData = {
    name: '',
    description: '',
    email: '',
    website: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    organizationId:"",
  };
  return (
    <MainLayout>  
        <Branch />
    </MainLayout>
  )
}

export default CreateBranch