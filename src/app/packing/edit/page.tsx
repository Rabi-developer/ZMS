'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSinglePacking} from '@/apis/packing';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import PackingForm from '@/components/item/packing/PackingForm';

const UpdatePackingPage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchPacking = async (id: string) => {
    try {
      const response = await getSinglePacking(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPacking(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ZMS">
      {
        !initialData ? <Loader /> :
          <div>
            <PackingForm isEdit={true} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdatePackingPage;
