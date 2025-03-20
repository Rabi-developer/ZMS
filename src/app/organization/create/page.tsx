import MainLayout from '@/components/MainLayout/MainLayout'
import Organization from '@/components/Organization/Commpany/Organization'
import React from 'react'

const CreateOrg = () => {
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
    zip: ''
  };
  return (
    <MainLayout>
      <Organization organizationId={null} initialData={initialData} />
    </MainLayout>
  )
}

export default CreateOrg