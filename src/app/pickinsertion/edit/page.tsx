'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSinglePickInsertion} from '@/apis/pickinsertion';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import PickInsertion from '@/components/item/pickinsertion/PickInsertion';

const UpdatePickInsertionPage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchPickInsertion = async (id: string) => {
    try {
      const response = await getSinglePickInsertion(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPickInsertion(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ZMS">
      {
        !initialData ? <Loader /> :
          <div>
            <PickInsertion isEdit={true} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdatePickInsertionPage;
