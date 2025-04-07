'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import StuffForm from '@/components/item/stuff/StuffForm';
import { getSingleStuff } from '@/apis/stuff';

const UpdateStuffPage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchStuff = async (id: string) => {
    try {
      const response = await getSingleStuff(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStuff(id);
    }
  }, [id]);

  return (
    <MainLayout>
      {
        !initialData ? <Loader /> :
          <div>
            <StuffForm isEdit={true} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateStuffPage;
