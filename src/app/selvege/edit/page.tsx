'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import SelvegeForm from '@/components/item/selvege/Selvege';
import { getSingleSelvege } from '@/apis/selvege';

const UpdateSelvegePage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchSelvege = async (id: string) => {
    try {
      const response = await getSingleSelvege(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSelvege(id);
    }
  }, [id]);

  return (
    <MainLayout>
      {
        !initialData ? <Loader /> :
          <div>
            <SelvegeForm isEdit={true} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateSelvegePage;
