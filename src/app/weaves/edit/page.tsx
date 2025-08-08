'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import Weaves from '@/components/item/weaves/Weaves';
import { getSingleWeaves } from '@/apis/weaves';

const UpdateWeavesPage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchWeaves = async (id: string) => {
    try {
      const response = await getSingleWeaves(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchWeaves(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ZMS">
      {
        !initialData ? <Loader /> :
          <div>
            <Weaves isEdit={true} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateWeavesPage;
