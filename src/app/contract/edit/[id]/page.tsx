'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Contract from '@/components/contract/ContractForm'
import { getSingleContract } from '@/apis/contract';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'

const UpdateSellerPage = () => {
  const { id } = useParams<{ id: string }>(); // Access the dynamic route parameter
  const [initialData, setInitialData] = useState(null);

  // Fetch the initial data for the Seller
  const fetchSeller = async (id: string) => {
    try {
      const response = await getSingleContract(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSeller(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ZMS">
      {
        !initialData ? <Loader /> :
          <div>
            <Contract id={id} initialData={initialData} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateSellerPage;
