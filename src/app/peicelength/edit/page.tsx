'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSinglePeiceLength} from '@/apis/peicelength';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import PeiceLengthForm from '@/components/item/peicelength/PeiceLengthForm';

const UpdatePeiceLengthPage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchPeiceLength = async (id: string) => {
    try {
      const response = await getSinglePeiceLength(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPeiceLength(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ZMS">
      {
        !initialData ? <Loader /> :
          <div>
            <PeiceLengthForm isEdit={true} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdatePeiceLengthPage;
