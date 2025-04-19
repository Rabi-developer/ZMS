'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import { getSingleWrapYarnType } from '@/apis/wrapyarntype';
import WrapYarnType from '@/components/item/wrapyarntype/WrapYarnType';

const UpdateWrapYarnTypePage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchWrapYarnType = async (id: string) => {
    try {
      const response = await getSingleWrapYarnType(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchWrapYarnType(id);
    }
  }, [id]);

  return (
    <MainLayout>
      {
        !initialData ? <Loader /> :
          <div>
            <WrapYarnType isEdit={true}/>
          </div>
      }
    </MainLayout>
  );
};

export default UpdateWrapYarnTypePage;
