'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import SelvegeWidthForm from '@/components/item/selvegewidth/SelvegeWidthForm';
import { getSingleSelvegeWidth } from '@/apis/selvegewidth';

const UpdateSelvegeWidthPage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchSelvegeWidth = async (id: string) => {
    try {
      const response = await getSingleSelvegeWidth(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSelvegeWidth(id);
    }
  }, [id]);

  return (
    <MainLayout>
      {
        !initialData ? <Loader /> :
          <div>
            <SelvegeWidthForm isEdit={true} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateSelvegeWidthPage;
