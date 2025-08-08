'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSingleEndUse} from '@/apis/enduse';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import EndUse from '@/components/item/enduse/EndUse';

const UpdateEndUsePage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchEndUse = async (id: string) => {
    try {
      const response = await getSingleEndUse(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEndUse(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ZMS">
      {
        !initialData ? <Loader /> :
          <div>
            <EndUse isEdit={true} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateEndUsePage;
