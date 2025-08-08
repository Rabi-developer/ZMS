'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Organization from '@/components/Organization/Commpany/Organization'
import { getSingleOrganization } from '@/apis/organization';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'

const UpdateOrganizationPage = () => {
  const { id } = useParams<{ id: string }>(); // Access the dynamic route parameter
  const [initialData, setInitialData] = useState(null);

  // Fetch the initial data for the organization
  const fetchOrganization = async (id: string) => {
    try {
      const response = await getSingleOrganization(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrganization(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ZMS">
      {
        !initialData ? <Loader /> :
          <div>
            <Organization id={id} initialData={initialData} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateOrganizationPage;
