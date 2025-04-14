'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSingleFabricTypes} from '@/apis/fabrictypes';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import FabricTypeForm from '@/components/item/fabrictypes/FabricTypeForm';

const UpdateFabricTypePage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchFabricType = async (id: string) => {
    try {
      const response = await getSingleFabricTypes(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchFabricType(id);
    }
  }, [id]);

  return (
    <MainLayout>
      {
        !initialData ? <Loader /> :
          <div>
            <FabricTypeForm isEdit={true} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateFabricTypePage;
