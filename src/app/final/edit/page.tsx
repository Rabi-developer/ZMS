'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSingleFinal} from '@/apis/final';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import Final from '@/components/item/final/Final';

const UpdateFinalPage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchFinal = async (id: string) => {
    try {
      const response = await getSingleFinal(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchFinal(id);
    }
  }, [id]);

  return (
    <MainLayout>
      {
        !initialData ? <Loader /> :
          <div>
            <Final isEdit={true} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateFinalPage;
