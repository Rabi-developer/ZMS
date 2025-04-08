'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import WeftYarnType from '@/components/item/weftyarntype/WeftYarnType';
import { getSingleWeftYarnType } from '@/apis/weftyarntype';

const UpdateWeftYarnTypePage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchWeftYarnType = async (id: string) => {
    try {
      const response = await getSingleWeftYarnType(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchWeftYarnType(id);
    }
  }, [id]);

  return (
    <MainLayout>
      {
        !initialData ? <Loader /> :
          <div>
            <WeftYarnType isEdit={true} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateWeftYarnTypePage;
